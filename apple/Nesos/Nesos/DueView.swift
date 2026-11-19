#if os(iOS)
import SwiftUI

/// Overdue, Today and This Week on one page. One section is open at a time;
/// the others fold down to tiles.
struct DueView: View {
    @Binding var path: [Route]
    @Environment(AppStore.self) private var store
    @State private var open: DueSection?
    @State private var adding: Bool
    @State private var editingId: String?
    @State private var keyboardUp = false

    init(start: DueSection, startAdding: Bool, path: Binding<[Route]>) {
        _path = path
        _open = State(initialValue: Optional(start))
        _adding = State(initialValue: startAdding)
    }

    var body: some View {
        Screen {
            HeaderBar(onBack: { path.removeLast() }, onAccount: { path.append(.profile) })

            VStack(spacing: 10) {
                ForEach(DueSection.allCases) { section in
                    if section == open {
                        openSection(section)
                            .layoutPriority(1)
                    } else if !(keyboardUp && open != nil) {
                        closedTile(section)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.bottom, keyboardUp ? 0 : 26)
        }
        .trackKeyboard($keyboardUp)
    }

    private func closedTile(_ section: DueSection) -> some View {
        Button {
            withAnimation(.easeOut(duration: 0.22)) {
                open = section
                adding = false
                editingId = nil
            }
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                Text(section.title).caps(10)
                    .padding(EdgeInsets(top: 12, leading: 14, bottom: 0, trailing: 12))
                Spacer(minLength: 0)
                TileBar(leading: 14, trailing: 12) {
                    Text("\(store.count(section))").caps(10)
                    Spacer(minLength: 0)
                    Icon(.chevronDown, size: 14)
                }
            }
            .foregroundStyle(store.palette.text(section))
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(height: 64)
            .background(store.palette.color(section))
            .clipShape(RoundedRectangle(cornerRadius: 7))
        }
        .buttonStyle(.plain)
    }

    private func openSection(_ section: DueSection) -> some View {
        let items = store.items(section)
        let openItems = items.filter { !$0.done }
        let projectCount = Set(openItems.map(\.clientId)).count

        return VStack(spacing: 0) {
            Button {
                withAnimation(.easeOut(duration: 0.22)) { open = nil; adding = false; editingId = nil }
            } label: {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text(section.title).caps(16, spacing: 0.24)
                        Spacer()
                        Text("\(openItems.count)").font(NFont.playfair(28))
                    }
                    .padding(EdgeInsets(top: 16, leading: 16, bottom: 0, trailing: 14))
                    Spacer(minLength: 0)
                    TileBar(height: 28, leading: 16, trailing: 12) {
                        Text(summary(section, tasks: openItems.count, projects: projectCount)).caps(10).lineLimit(1)
                        Spacer(minLength: 0)
                        Icon(.chevronUp, size: 14)
                    }
                }
                .frame(height: 96)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            HStack {
                Text("TASKS").caps(11, spacing: 0.24)
                Spacer()
                Button {
                    withAnimation(.easeOut(duration: 0.2)) { adding.toggle(); editingId = nil }
                } label: {
                    HStack(spacing: 6) {
                        Text(adding ? "CLOSE" : "ADD").caps(11, spacing: 0.24)
                        Icon(adding ? .close : .plus, size: 13)
                    }
                    .frame(height: 28)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .padding(EdgeInsets(top: 10, leading: 16, bottom: 6, trailing: 14))

            if adding {
                TaskEditCard(mode: .new, projectId: nil, defaultDue: defaultDue(section), fallbackHex: store.palette.hex(section)) {
                    withAnimation(.easeOut(duration: 0.2)) { adding = false }
                }
                .padding(EdgeInsets(top: 0, leading: 10, bottom: 8, trailing: 10))
            }

            if items.isEmpty {
                Text(emptyText(section))
                    .font(NFont.inter(13)).italic()
                    .opacity(0.9)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(EdgeInsets(top: 4, leading: 16, bottom: 18, trailing: 16))
            } else {
                BarScroll(thumb: .white.opacity(0.75), gap: 6, hugs: true) {
                    LazyVStack(spacing: 6) {
                        ForEach(items) { task in
                            row(task)
                        }
                    }
                    .padding(.bottom, 12)
                }
                .scrollFade()
                .padding(.leading, 10)
                .padding(.trailing, 4)
            }
        }
        .foregroundStyle(store.palette.text(section))
        .background(store.palette.color(section))
        .clipShape(RoundedRectangle(cornerRadius: 7))
    }

    @ViewBuilder private func row(_ task: ProjectTask) -> some View {
        let project = store.project(task.clientId)
        let tint = Tint(project?.color ?? "#6a95a8")
        if editingId == task.id {
            TaskEditCard(mode: .edit(task), projectId: nil) {
                withAnimation(.easeOut(duration: 0.2)) { editingId = nil }
            }
        } else {
            TaskRow(task: task, tint: tint, projectName: project?.name, height: 52, openOpacity: 0.88) {
                Task { await store.toggle(task) }
            } onTap: {
                withAnimation(.easeOut(duration: 0.2)) { editingId = task.id; adding = false }
            }
        }
    }

    private func defaultDue(_ section: DueSection) -> String? {
        section == .week ? DueDate.tomorrow : DueDate.today
    }

    private func summary(_ section: DueSection, tasks: Int, projects: Int) -> String {
        if tasks == 0 { return emptyText(section).replacingOccurrences(of: ".", with: "") }
        let t = tasks == 1 ? "1 TASK" : "\(tasks) TASKS"
        let p = projects == 1 ? "1 PROJECT" : "\(projects) PROJECTS"
        return "\(t) · \(p)"
    }

    private func emptyText(_ section: DueSection) -> String {
        switch section {
        case .overdue: "Nothing overdue."
        case .today: "Nothing due today."
        case .week: "Nothing due this week."
        }
    }
}
#endif
