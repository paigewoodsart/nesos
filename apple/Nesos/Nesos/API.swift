import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case server(String)

    var errorDescription: String? {
        switch self {
        case .unauthorized: "You've been signed out. Please sign in again."
        case .server(let message): message
        }
    }
}

/// Talks to the same /api routes the website uses, with the bearer token.
struct API {
    let token: String

    // MARK: Tasks

    func tasks(weekId: String) async throws -> [TaskItem] {
        try await get("api/db/tasks", query: ["weekId": weekId])
    }

    func recurringTasks() async throws -> [TaskItem] {
        try await get("api/db/tasks", query: ["recurring": "true"])
    }

    func save(_ task: TaskItem) async throws {
        try await send("POST", "api/db/tasks", body: task)
    }

    // MARK: Notes and projects

    func save(_ note: NewNote) async throws {
        try await send("POST", "api/db/notes", body: note)
    }

    func save(_ project: NewProject) async throws {
        try await send("POST", "api/db/clients", body: project)
    }

    // MARK: Account

    func deleteAccount() async throws {
        try await send("DELETE", "api/account/delete")
    }

    // MARK: Plumbing

    private func get<T: Decodable>(_ path: String, query: [String: String]) async throws -> T {
        let data = try await send("GET", path, query: query)
        return try JSONDecoder().decode(T.self, from: data)
    }

    @discardableResult
    private func send(
        _ method: String,
        _ path: String,
        query: [String: String] = [:],
        body: (any Encodable)? = nil
    ) async throws -> Data {
        var components = URLComponents(url: Config.baseURL.appending(path: path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        var request = URLRequest(url: components.url!)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: request, delegate: KeepAuthOnRedirect(token: token))
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 401 { throw APIError.unauthorized }
        guard (200..<300).contains(status) else {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
            throw APIError.server(message ?? "Something went wrong (\(status)). Please try again.")
        }
        return data
    }
}

/// URLSession drops the Authorization header when a request is redirected to
/// another host (for example nesos.co to www.nesos.co). Put it back, but only
/// for Nesos hosts.
nonisolated final class KeepAuthOnRedirect: NSObject, URLSessionTaskDelegate {
    let token: String
    init(token: String) { self.token = token }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest
    ) async -> URLRequest? {
        var request = request
        if let host = request.url?.host, host == "nesos.co" || host.hasSuffix(".nesos.co") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }
}
