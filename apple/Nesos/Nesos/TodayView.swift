import SwiftUI

/// iPhone home: today's tasks and the three quick-add buttons.
struct TodayView: View {
    @Environment(PlannerStore.self) private var store
    @Environment(QuickAddRouter.self) private var router
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                List {
                    Section {
                        if store.todayTasks.isEmpty && !store.isLoading {
                            Text("Nothing planned for today yet.")
                                .foregroundStyle(Theme.inkLight)
                                .listRowBackground(Color.clear)
                        }
                        ForEach(store.todayTasks) { task in
                            TaskRow(task: task) {
                                Task { await store.toggle(task) }
                            }
                            .listRowBackground(Color.clear)
                        }
                    } header: {
                        Text(Week.format(.now, "EEEEMMMMd"))
                            .font(.subheadline)
                            .foregroundStyle(Theme.inkLight)
                            .textCase(nil)
                    }

                    if let error = store.errorMessage {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .listRowBackground(Color.clear)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .refreshable { await store.load() }

                QuickAddBar()
            }
            .background(Theme.paper.ignoresSafeArea())
            .navigationTitle("Today")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        router.sheet = .settings
                    } label: {
                        Image(systemName: "person.crop.circle")
                    }
                    .accessibilityLabel("Account")
                }
            }
        }
        .task { await store.load() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { Task { await store.load() } }
        }
    }
}

private struct TaskRow: View {
    let task: TaskItem
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(task.completed ? Theme.sage : Theme.line)
                Text(task.text)
                    .foregroundStyle(task.completed ? Theme.inkLight : Theme.ink)
                    .strikethrough(task.completed, color: Theme.inkLight)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(Rectangle())
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.success, trigger: task.completed)
    }
}

private struct QuickAddBar: View {
    @Environment(QuickAddRouter.self) private var router

    var body: some View {
        HStack(spacing: 10) {
            button("Task", "checkmark.circle", .task)
            button("Note", "note.text", .note)
            button("Project", "folder", .project)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.paperWarm.opacity(0.6))
    }

    private func button(_ title: String, _ icon: String, _ sheet: AppSheet) -> some View {
        Button {
            router.sheet = sheet
        } label: {
            Label(title, systemImage: icon)
                .font(.subheadline.weight(.medium))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(.white, in: Capsule())
                .overlay(Capsule().stroke(Theme.line))
                .foregroundStyle(Theme.accent)
        }
        .buttonStyle(.plain)
    }
}
