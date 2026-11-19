import SwiftUI

// Native quick add for Mac and iPad, on top of the desktop planner.

struct QuickTaskSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(QuickAddRouter.self) private var router
    @Environment(\.dismiss) private var dismiss
    @State private var text = ""
    @State private var projectId = ""
    @State private var hasDue = false
    @State private var dueDate = Date()
    @State private var busy = false
    @FocusState private var focused: Bool

    private var canSave: Bool {
        !text.trimmingCharacters(in: .whitespaces).isEmpty && store.project(projectId) != nil && !busy
    }

    var body: some View {
        SheetFrame(title: "New Task", actionTitle: "Add", canSave: canSave, action: save) {
            TextField("What needs doing?", text: $text)
                .focused($focused)
                .onSubmit(save)
            if store.loaded && store.projects.isEmpty {
                Text("Add a project first, then tasks go inside it.")
                    .foregroundStyle(Theme.inkLight)
            } else {
                Picker("Project", selection: $projectId) {
                    ForEach(store.projects) { project in
                        Text(project.name).tag(project.id)
                    }
                }
            }
            Toggle("Due date", isOn: $hasDue)
            if hasDue {
                DatePicker("Due", selection: $dueDate, displayedComponents: .date)
            }
        }
        .task {
            focused = true
            if !store.loaded { await store.load() }
            if projectId.isEmpty { projectId = store.projects.first?.id ?? "" }
        }
    }

    private func save() {
        guard canSave else { return }
        busy = true
        Task {
            let ok = await store.addTask(
                projectId: projectId,
                text: text.trimmingCharacters(in: .whitespaces),
                due: hasDue ? DueDate.string(dueDate) : nil
            )
            busy = false
            if ok {
                router.didSave()
                dismiss()
            }
        }
    }
}

struct QuickProjectSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(QuickAddRouter.self) private var router
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var color = Theme.projectColors[7]
    @State private var busy = false
    @FocusState private var focused: Bool

    private var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty && !busy }

    var body: some View {
        SheetFrame(title: "New Project", actionTitle: "Add", canSave: canSave, action: save) {
            TextField("Project name", text: $name)
                .focused($focused)
                .onSubmit(save)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 6), spacing: 8) {
                ForEach(Theme.projectColors, id: \.self) { hex in
                    Button { color = hex } label: {
                        RoundedRectangle(cornerRadius: 7)
                            .fill(Color(hex: hex))
                            .frame(height: 30)
                            .overlay {
                                if hex == color {
                                    RoundedRectangle(cornerRadius: 7).strokeBorder(Theme.ink, lineWidth: 2)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Color \(hex)")
                }
            }
            .padding(.vertical, 4)
        }
        .task {
            focused = true
            if !store.loaded { await store.load() }
        }
    }

    private func save() {
        guard canSave else { return }
        busy = true
        Task {
            let created = await store.addProject(name: name.trimmingCharacters(in: .whitespaces), color: color)
            busy = false
            if created != nil {
                router.didSave()
                dismiss()
            }
        }
    }
}

/// Account details on Mac (Settings window) and iPad (sheet).
struct AccountSheet: View {
    var showsDone = true

    @Environment(AuthStore.self) private var auth
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var confirmDelete = false

    init(showsDone: Bool = true) {
        self.showsDone = showsDone
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Account").font(NFont.playfair(22)).foregroundStyle(Theme.ink)
                Spacer()
                if showsDone {
                    Button("Done") { dismiss() }
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                if let name = auth.name { Text(name).font(NFont.inter(15, .medium)) }
                Text(auth.email ?? "Signed in").font(NFont.inter(13)).foregroundStyle(Theme.inkLight)
            }
            Link("Privacy policy", destination: Config.privacyURL)
                .font(NFont.inter(13))
            Divider()
            Button("Sign out") {
                WebSession.clear()
                store.reset()
                auth.signOut()
            }
            Button("Delete account", role: .destructive) { confirmDelete = true }
            if let message = store.errorMessage {
                Text(message).font(NFont.inter(12)).foregroundStyle(Theme.danger)
            }
            Spacer(minLength: 0)
        }
        .padding(24)
        .frame(minWidth: 320, minHeight: 280)
        .confirmationDialog("Delete your Nesos account?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete account and all data", role: .destructive) {
                Task {
                    if await store.deleteAccount() { WebSession.clear() }
                }
            }
        } message: {
            Text("This removes your projects, tasks, notes and files for good. It can't be undone.")
        }
    }
}

/// Title, form fields and Cancel / Add buttons for the quick-add sheets.
private struct SheetFrame<Fields: View>: View {
    let title: String
    let actionTitle: String
    let canSave: Bool
    let action: () -> Void
    let fields: Fields

    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    init(title: String, actionTitle: String, canSave: Bool, action: @escaping () -> Void, @ViewBuilder fields: () -> Fields) {
        self.title = title
        self.actionTitle = actionTitle
        self.canSave = canSave
        self.action = action
        self.fields = fields()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title).font(NFont.playfair(22)).foregroundStyle(Theme.ink)
            VStack(alignment: .leading, spacing: 12) { fields }
                .textFieldStyle(.roundedBorder)
                .font(NFont.inter(14))
            if let message = store.errorMessage {
                Text(message).font(NFont.inter(12)).foregroundStyle(Theme.danger)
            }
            Spacer(minLength: 0)
            HStack {
                Spacer()
                Button("Cancel", role: .cancel) { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Button(actionTitle, action: action)
                    .keyboardShortcut(.defaultAction)
                    .buttonStyle(.borderedProminent)
                    .disabled(!canSave)
            }
        }
        .padding(24)
        .frame(minWidth: 360, minHeight: 300)
    }
}
