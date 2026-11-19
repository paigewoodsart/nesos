import SwiftUI

/// Shared frame for the quick-add sheets: title, Cancel and Save.
private struct QuickAddForm<Content: View>: View {
    let title: String
    let canSave: Bool
    let save: () async -> Bool
    let content: Content

    init(
        title: String,
        canSave: Bool,
        save: @escaping () async -> Bool,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.canSave = canSave
        self.save = save
        self.content = content()
    }

    @Environment(PlannerStore.self) private var store
    @Environment(QuickAddRouter.self) private var router
    @Environment(\.dismiss) private var dismiss
    @State private var saving = false

    var body: some View {
        NavigationStack {
            Form {
                content
                if let error = store.errorMessage {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }
            }
            .formStyle(.grouped)
            .navigationTitle(title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { submit() }
                        .disabled(!canSave || saving)
                }
            }
        }
        #if os(macOS)
        .frame(minWidth: 420, minHeight: 260)
        #endif
        .presentationDetents([.medium, .large])
        .onAppear { store.errorMessage = nil }
    }

    func submit() {
        guard canSave, !saving else { return }
        saving = true
        Task {
            if await save() {
                router.didSave()
                dismiss()
            }
            saving = false
        }
    }
}

struct QuickAddTaskView: View {
    @Environment(PlannerStore.self) private var store
    @State private var text = ""
    @State private var day = Week.dayIndex()
    @FocusState private var focused: Bool

    private var trimmed: String { text.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        QuickAddForm(title: "New Task", canSave: !trimmed.isEmpty) {
            await store.addTask(trimmed, dayIndex: day)
        } content: {
            TextField("What needs doing?", text: $text, axis: .vertical)
                .focused($focused)
            Picker("Day", selection: $day) {
                ForEach(Array(Week.days().enumerated()), id: \.offset) { index, date in
                    Text(index == Week.dayIndex() ? "Today" : Week.format(date, "EEEE"))
                        .tag(index)
                }
                Text("Anytime this week").tag(-1)
            }
        }
        .onAppear { focused = true }
    }
}

struct QuickAddNoteView: View {
    @Environment(PlannerStore.self) private var store
    @State private var text = ""
    @FocusState private var focused: Bool

    private var trimmed: String { text.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        QuickAddForm(title: "New Note", canSave: !trimmed.isEmpty) {
            await store.addNote(trimmed)
        } content: {
            TextField("Write it down...", text: $text, axis: .vertical)
                .lineLimit(5...12)
                .focused($focused)
            Text("Saved to today in your planner.")
                .font(.footnote)
                .foregroundStyle(Theme.inkLight)
        }
        .onAppear { focused = true }
    }
}

struct QuickAddProjectView: View {
    @Environment(PlannerStore.self) private var store
    @State private var name = ""
    @State private var color = Theme.projectColors[6]
    @FocusState private var focused: Bool

    private var trimmed: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        QuickAddForm(title: "New Project", canSave: !trimmed.isEmpty) {
            await store.addProject(name: trimmed, color: color)
        } content: {
            TextField("Project name", text: $name)
                .focused($focused)
            Section("Color") {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 10) {
                    ForEach(Theme.projectColors, id: \.self) { hex in
                        Circle()
                            .fill(Color(hex: hex))
                            .frame(width: 28, height: 28)
                            .overlay(
                                Circle()
                                    .stroke(Theme.ink, lineWidth: color == hex ? 2 : 0)
                                    .padding(-3)
                            )
                            .onTapGesture { color = hex }
                            .accessibilityAddTraits(color == hex ? .isSelected : [])
                    }
                }
                .padding(.vertical, 6)
            }
        }
        .onAppear { focused = true }
    }
}
