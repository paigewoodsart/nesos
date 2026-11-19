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

    func projects() async throws -> [Project] { try await get("api/db/clients") }
    func openTasks() async throws -> [ProjectTask] { try await get("api/db/client-tasks", ["all": "1"]) }
    func tasks(projectId: String) async throws -> [ProjectTask] { try await get("api/db/client-tasks", ["clientId": projectId]) }
    func save(_ task: ProjectTask) async throws { try await send("POST", "api/db/client-tasks", body: task) }
    func deleteTask(id: String) async throws { try await send("DELETE", "api/db/client-tasks", query: ["id": id]) }
    func save(_ project: Project) async throws { try await send("POST", "api/db/clients", body: project) }
    func save(_ session: SessionLog) async throws { try await send("POST", "api/db/sessions", body: session) }
    func settings() async throws -> AppearanceSettings { try await get("api/db/settings") }
    func save(_ settings: AppearanceSettings) async throws { try await send("POST", "api/db/settings", body: settings) }
    func files(projectId: String) async throws -> [ProjectFile] { try await get("api/db/files", ["clientId": projectId]) }
    func deleteAccount() async throws { try await send("DELETE", "api/account/delete") }

    /// Multipart upload to /api/db/files/upload, the same route the website uses.
    func upload(_ data: Data, fileName: String, mimeType: String, projectId: String) async throws {
        let boundary = "nesos-\(UUID().uuidString)"
        var body = Data()
        func field(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n".data(using: .utf8)!)
        }
        field("clientId", projectId)
        body.append("--\(boundary)\r\nContent-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\nContent-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        var request = URLRequest(url: Config.baseURL.appending(path: "api/db/files/upload"))
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        try await perform(request)
    }

    // MARK: Plumbing

    private func get<T: Decodable>(_ path: String, _ query: [String: String] = [:]) async throws -> T {
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
        return try await perform(request)
    }

    @discardableResult
    private func perform(_ request: URLRequest) async throws -> Data {
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
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        var request = request
        if let host = request.url?.host, host == "nesos.co" || host.hasSuffix(".nesos.co") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        completionHandler(request)
    }
}
