#if os(iOS)
import SwiftUI

/// The inline card for adding or editing a task. In a project it adds to
/// that project; on the Due screen it also asks which project.
struct TaskEditCard: View {
    enum Mode: Equatable {
        case new
        case edit(ProjectTask)
    }

    let mode: Mode
    /// The project this card adds to. nil shows project chips (Due screen).
    var projectId: String?
    var defaultDue: String?
    /// Color used before a project is picked (Due screen section color).
    var fallbackHex = "#6a95a8"
    let onDone: () -> Void

    init(mode: Mode, projectId: String? = nil, defaultDue: String? = nil, fallbackHex: String = "#6a95a8", onDone: @escaping () -> Void) {
        self.mode = mode
        self.projectId = projectId
        self.defaultDue = defaultDue
        self.fallbackHex = fallbackHex
        self.onDone = onDone
    }

    @Environment(AppStore.self) private var store
    @State private var text = ""
    @State private var due: String?
    @State private var chosenProject: String?
    @State private var showDatePicker = false
    @State private var pickedDate = Date()
    @State private var busy = false
    @State private var confirmDelete = false
    @FocusState private var focused: Bool

    private var editing: ProjectTask? {
        if case let .edit(task) = mode { return task }
        return nil
    }

    private var currentProjectId: String? { projectId ?? chosenProject }
    private var tint: Tint { Tint(currentProjectId.flatMap { store.project($0)?.color } ?? fallbackHex) }
    private var canSave: Bool { !text.trimmingCharacters(in: .whitespaces).isEmpty && currentProjectId != nil && !busy }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                Text(editing == nil ? "NEW TASK" : "EDIT TASK").caps(10).foregroundStyle(tint.label)
                TextField("", text: $text, prompt: Text("What needs doing?").foregroundStyle(Theme.inkLight.opacity(0.7)))
                    .font(NFont.inter(15))
                    .foregroundStyle(Theme.ink)
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .submitLabel(.done)
                    .onSubmit { Task { await save() } }
                    .frame(height: 32)
                    .overlay(alignment: .bottom) { Rectangle().fill(tint.fill).frame(height: 1.5) }
            }
            .padding(EdgeInsets(top: 12, leading: 12, bottom: 10, trailing: 12))

            if projectId == nil {
                VStack(alignment: .leading, spacing: 6) {
                    Text("PROJECT").caps(10).foregroundStyle(tint.label)
                    ScrollView(.horizontal) {
                        HStack(spacing: 5) {
                            ForEach(store.projects) { project in
                                chip(project.name, selected: chosenProject == project.id, tint: Tint(project.color)) {
                                    chosenProject = project.id
                                }
                            }
                        }
                    }
                    .scrollIndicators(.hidden)
                }
                .padding(EdgeInsets(top: 0, leading: 12, bottom: 12, trailing: 12))
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("DUE").caps(10).foregroundStyle(tint.label)
                HStack(spacing: 5) {
                    chip("Today", selected: due == DueDate.today, tint: tint, grow: true) { due = DueDate.today }
                    chip("Tomorrow", selected: due == DueDate.tomorrow, tint: tint, grow: true) { due = DueDate.tomorrow }
                    chip(pickLabel, selected: isPicked, tint: tint, grow: true) {
                        focused = false
                        pickedDate = DueDate.parse(due) ?? .now
                        showDatePicker = true
                    }
                    chip("None", selected: due == nil, tint: tint, grow: true) { due = nil }
                }
            }
            .padding(EdgeInsets(top: 0, leading: 12, bottom: 12, trailing: 12))

            if editing == nil {
                Button { Task { await save() } } label: {
                    HStack(spacing: 8) {
                        Text(addLabel).caps(11, spacing: 0.24).lineLimit(1)
                        Icon(.plus, size: 13)
                    }
                    .foregroundStyle(tint.onFill)
                    .frame(maxWidth: .infinity)
                    .frame(height: 36)
                    .background(tint.fill.opacity(canSave ? 1 : 0.6))
                }
                .buttonStyle(.plain)
                .disabled(!canSave)
            } else {
                GeometryReader { proxy in
                    HStack(spacing: 0) {
                        Button { confirmDelete = true } label: {
                            Text("DELETE").caps(11, spacing: 0.24)
                                .foregroundStyle(Theme.danger)
                                .frame(width: proxy.size.width / 3, height: 36)
                                .overlay(alignment: .top) { Rectangle().fill(tint.opacity(0.35)).frame(height: 1) }
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)

                        Button { Task { await save() } } label: {
                            Text("SAVE").caps(11, spacing: 0.24)
                                .foregroundStyle(tint.onFill)
                                .frame(width: proxy.size.width * 2 / 3, height: 36)
                                .background(tint.fill.opacity(canSave ? 1 : 0.6))
                        }
                        .buttonStyle(.plain)
                        .disabled(!canSave)
                    }
                }
                .frame(height: 36)
            }
        }
        .background(Color.white.opacity(0.75))
        .clipShape(RoundedRectangle(cornerRadius: 7))
        .overlay(RoundedRectangle(cornerRadius: 7).stroke(tint.fill, lineWidth: 1))
        .confirmationDialog("Delete this task?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete", role: .destructive) { Task { await delete() } }
        }
        .sheet(isPresented: $showDatePicker) {
            VStack(spacing: 8) {
                DatePicker("Due date", selection: $pickedDate, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .labelsHidden()
                    .tint(tint.fill)
                Button {
                    due = DueDate.string(pickedDate)
                    showDatePicker = false
                } label: {
                    Text("SET DUE DATE").caps(11, spacing: 0.24)
                        .foregroundStyle(tint.onFill)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(tint.fill, in: RoundedRectangle(cornerRadius: 7))
                }
                .buttonStyle(.plain)
            }
            .padding(20)
            .presentationDetents([.height(470)])
            .presentationDragIndicator(.visible)
        }
        .onAppear(perform: setUp)
    }

    private var isPicked: Bool {
        guard let due else { return false }
        return due != DueDate.today && due != DueDate.tomorrow
    }

    private var pickLabel: String { isPicked ? (DueDate.label(due) ?? "Pick date") : "Pick date" }

    private var addLabel: String {
        guard let id = currentProjectId, let project = store.project(id) else { return "PICK A PROJECT" }
        return "ADD TO \(project.name)"
    }

    private func chip(_ title: String, selected: Bool, tint: Tint, grow: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(NFont.playfair(11))
                .lineLimit(1)
                .foregroundStyle(selected ? tint.onFill : Theme.ink)
                .padding(.horizontal, grow ? 5 : 10)
                .frame(maxWidth: grow ? .infinity : nil)
                .frame(height: 30)
                .background(selected ? tint.fill : Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 7))
                .overlay(RoundedRectangle(cornerRadius: 7).stroke(selected ? tint.fill : Theme.ink.opacity(0.14), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func setUp() {
        if let task = editing {
            text = task.text
            due = DueDate.parse(task.dueDate).map(DueDate.string)
            chosenProject = task.clientId
        } else {
            due = defaultDue
            chosenProject = projectId ?? (store.projects.count == 1 ? store.projects.first?.id : nil)
            focused = true
        }
    }

    private func save() async {
        guard canSave, let id = currentProjectId else { return }
        busy = true
        defer { busy = false }
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        let ok: Bool
        if var task = editing {
            task.text = trimmed
            task.dueDate = due
            task.clientId = id
            ok = await store.update(task)
        } else {
            ok = await store.addTask(projectId: id, text: trimmed, due: due)
        }
        if ok { onDone() }
    }

    private func delete() async {
        guard let task = editing else { return }
        if await store.delete(task) { onDone() }
    }
}

/// The inline card for adding a project, or changing its name and color.
struct ProjectEditCard: View {
    var project: Project?
    let onDone: (Project?) -> Void

    init(project: Project? = nil, onDone: @escaping (Project?) -> Void) {
        self.project = project
        self.onDone = onDone
    }

    @Environment(AppStore.self) private var store
    @State private var name = ""
    @State private var color = "#d9a05b"
    @State private var busy = false
    @FocusState private var focused: Bool

    private var tint: Tint { Tint(color) }
    private var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty && !busy }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                Text(project == nil ? "NEW PROJECT" : "EDIT PROJECT").caps(10).foregroundStyle(tint.label)
                TextField("", text: $name, prompt: Text("Project name").foregroundStyle(Theme.inkLight.opacity(0.7)))
                    .font(NFont.inter(15))
                    .foregroundStyle(Theme.ink)
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .submitLabel(.done)
                    .onSubmit { Task { await save() } }
                    .frame(height: 32)
                    .overlay(alignment: .bottom) { Rectangle().fill(tint.fill).frame(height: 1.5) }
            }
            .padding(EdgeInsets(top: 12, leading: 12, bottom: 10, trailing: 12))

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("COLOR").caps(10).foregroundStyle(tint.label)
                    Spacer()
                    ColorPicker(selection: Binding(
                        get: { Color(hex: color) },
                        set: { color = $0.hexString }
                    ), supportsOpacity: false) {
                        Text("CUSTOM").caps(9).foregroundStyle(tint.label)
                    }
                    .fixedSize()
                }
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 6), spacing: 8) {
                    ForEach(Theme.projectColors, id: \.self) { hex in
                        Button { color = hex } label: {
                            RoundedRectangle(cornerRadius: 7)
                                .fill(Color(hex: hex))
                                .frame(height: 30)
                                .overlay {
                                    if hex.lowercased() == color.lowercased() {
                                        RoundedRectangle(cornerRadius: 8).stroke(Color.white, lineWidth: 2)
                                            .padding(-1)
                                        RoundedRectangle(cornerRadius: 10).stroke(Theme.ink, lineWidth: 2)
                                            .padding(-3)
                                    }
                                }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Color \(hex)")
                    }
                }
            }
            .padding(EdgeInsets(top: 0, leading: 12, bottom: 12, trailing: 12))

            Button { Task { await save() } } label: {
                HStack(spacing: 8) {
                    Text(project == nil ? "ADD PROJECT" : "SAVE").caps(11, spacing: 0.24)
                    if project == nil { Icon(.plus, size: 13) }
                }
                .foregroundStyle(tint.onFill)
                .frame(maxWidth: .infinity)
                .frame(height: 38)
                .background(tint.fill.opacity(canSave ? 1 : 0.6))
            }
            .buttonStyle(.plain)
            .disabled(!canSave)
        }
        .background(Color.white.opacity(0.78))
        .clipShape(RoundedRectangle(cornerRadius: 7))
        .overlay(RoundedRectangle(cornerRadius: 7).stroke(tint.fill, lineWidth: 1))
        .onAppear {
            if let project {
                name = project.name
                color = project.color
            } else {
                let used = Set(store.projects.map { $0.color.lowercased() })
                color = Theme.projectColors.first { !used.contains($0) } ?? "#d9a05b"
                focused = true
            }
        }
    }

    private func save() async {
        guard canSave else { return }
        busy = true
        defer { busy = false }
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        if var existing = project {
            existing.name = trimmed
            existing.color = color
            if await store.update(existing) { onDone(existing) }
        } else if let created = await store.addProject(name: trimmed, color: color) {
            onDone(created)
        }
    }
}
#endif
