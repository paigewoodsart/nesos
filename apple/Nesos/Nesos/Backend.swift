import Foundation

/// Where the app's data lives: the Nesos account (signed in), or this device
/// only (guest mode, for testing before sign-in is live).
protocol Backend {
    func projects() async throws -> [Project]
    func openTasks() async throws -> [ProjectTask]
    func tasks(projectId: String) async throws -> [ProjectTask]
    func save(_ task: ProjectTask) async throws
    func deleteTask(id: String) async throws
    func save(_ project: Project) async throws
    func save(_ session: SessionLog) async throws
    func settings() async throws -> AppearanceSettings
    func save(_ settings: AppearanceSettings) async throws
    func fileCount(projectId: String) async throws -> Int
    func upload(_ data: Data, fileName: String, mimeType: String, projectId: String) async throws
    func deleteAccount() async throws
}

struct RemoteBackend: Backend {
    let api: API

    func projects() async throws -> [Project] { try await api.projects() }
    func openTasks() async throws -> [ProjectTask] { try await api.openTasks() }
    func tasks(projectId: String) async throws -> [ProjectTask] { try await api.tasks(projectId: projectId) }
    func save(_ task: ProjectTask) async throws { try await api.save(task) }
    func deleteTask(id: String) async throws { try await api.deleteTask(id: id) }
    func save(_ project: Project) async throws { try await api.save(project) }
    func save(_ session: SessionLog) async throws { try await api.save(session) }
    func settings() async throws -> AppearanceSettings { try await api.settings() }
    func save(_ settings: AppearanceSettings) async throws { try await api.save(settings) }
    func fileCount(projectId: String) async throws -> Int { try await api.files(projectId: projectId).count }
    func upload(_ data: Data, fileName: String, mimeType: String, projectId: String) async throws {
        try await api.upload(data, fileName: fileName, mimeType: mimeType, projectId: projectId)
    }
    func deleteAccount() async throws { try await api.deleteAccount() }
}

/// Guest mode: everything is saved in one file on this device. Nothing syncs.
final class LocalBackend: Backend {
    static let shared = LocalBackend()

    private struct Store: Codable {
        var projects: [Project] = []
        var tasks: [ProjectTask] = []
        var sessions: [SessionLog] = []
        var settings = AppearanceSettings()
    }

    private var store: Store
    private let url: URL

    private init() {
        let folder = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        url = folder.appending(path: "nesos-guest.json")
        if let data = try? Data(contentsOf: url), let saved = try? JSONDecoder().decode(Store.self, from: data) {
            store = saved
        } else {
            store = Store()
        }
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(store) { try? data.write(to: url, options: .atomic) }
    }

    func projects() async throws -> [Project] { store.projects }
    func openTasks() async throws -> [ProjectTask] { store.tasks.filter { !$0.archived } }
    func tasks(projectId: String) async throws -> [ProjectTask] { store.tasks.filter { $0.clientId == projectId } }

    func save(_ task: ProjectTask) async throws {
        if let i = store.tasks.firstIndex(where: { $0.id == task.id }) { store.tasks[i] = task } else { store.tasks.append(task) }
        persist()
    }

    func deleteTask(id: String) async throws {
        store.tasks.removeAll { $0.id == id }
        persist()
    }

    func save(_ project: Project) async throws {
        if let i = store.projects.firstIndex(where: { $0.id == project.id }) { store.projects[i] = project } else { store.projects.append(project) }
        persist()
    }

    func save(_ session: SessionLog) async throws {
        store.sessions.append(session)
        persist()
    }

    func settings() async throws -> AppearanceSettings { store.settings }

    func save(_ settings: AppearanceSettings) async throws {
        if let theme = settings.theme { store.settings.theme = theme }
        if let color = settings.customColor { store.settings.customColor = color }
        if let flag = settings.staticBackground { store.settings.staticBackground = flag }
        persist()
    }

    func fileCount(projectId: String) async throws -> Int { 0 }

    func upload(_ data: Data, fileName: String, mimeType: String, projectId: String) async throws {
        throw APIError.server("Files need an account. Sign in to attach files.")
    }

    func deleteAccount() async throws {
        store = Store()
        persist()
    }
}
