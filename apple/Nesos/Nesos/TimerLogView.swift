#if os(iOS)
import SwiftUI

/// A project's timer log: every saved session, newest first.
struct TimerLogView: View {
    let projectId: String
    @Binding var path: [Route]

    @Environment(AppStore.self) private var store
    @State private var sessions: [SessionLog] = []
    @State private var loaded = false
    @State private var deleting: SessionLog?
    @State private var renamingId: String?
    @State private var draft = ""
    @FocusState private var nameFocused: Bool

    init(projectId: String, path: Binding<[Route]>) {
        self.projectId = projectId
        _path = path
    }

    var body: some View {
        let project = store.project(projectId)
        let tint = Tint(project?.color ?? "#6a95a8")
        let total = sessions.reduce(0) { $0 + $1.minutes }

        Screen {
            HeaderBar(onBack: { path.removeLast() }, onAccount: { path.append(.profile) })

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(project?.name ?? "").caps(16, spacing: 0.24).lineLimit(1).minimumScaleFactor(0.7)
                    Spacer(minLength: 8)
                    Text("TIMER LOG").caps(10)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.25), in: Capsule())
                }
                .padding(EdgeInsets(top: 16, leading: 16, bottom: 0, trailing: 12))
                Spacer(minLength: 0)
                TileBar(height: 28, leading: 16, trailing: 12) {
                    Text(summary(total)).caps(10).lineLimit(1)
                    Spacer(minLength: 0)
                }
            }
            .foregroundStyle(tint.onFill)
            .frame(height: 96)
            .background(tint.fill)
            .clipShape(RoundedRectangle(cornerRadius: 7))

            BarScroll {
                LazyVStack(alignment: .leading, spacing: 6) {
                    if loaded && sessions.isEmpty {
                        Text("No sessions yet. Start the timer, then save it when you stop.")
                            .font(NFont.inter(13))
                            .foregroundStyle(Theme.inkLight)
                            .padding(.vertical, 12)
                    }
                    ForEach(groups, id: \.title) { group in
                        Text(group.title).caps(10, spacing: 0.24)
                            .foregroundStyle(Theme.inkSoft)
                            .padding(EdgeInsets(top: 6, leading: 2, bottom: 2, trailing: 0))
                        ForEach(group.sessions) { session in
                            row(session, tint: tint)
                        }
                    }
                }
                .padding(.bottom, 22)
            }
            .scrollFade()
            .frame(maxHeight: .infinity)
            .overlay { if !loaded { ProgressView().tint(Theme.accent) } }
        }
        .task {
            sessions = await store.sessions(projectId)
            loaded = true
        }
        .onChange(of: nameFocused) { _, focused in
            // Tapping away from the name field saves it too.
            if !focused, let id = renamingId, let session = sessions.first(where: { $0.id == id }) {
                rename(session)
            }
        }
        .confirmationDialog(
            "Delete this session?",
            isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }),
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                guard let session = deleting else { return }
                Task {
                    if await store.deleteSession(session.id) {
                        withAnimation(.easeOut(duration: 0.2)) { sessions.removeAll { $0.id == session.id } }
                    }
                }
            }
        }
    }

    private func row(_ session: SessionLog, tint: Tint) -> some View {
        let when = Self.date(session)
        return HStack(spacing: 10) {
            DueChip(text: Self.format(when, "MMM d"), tint: tint)
            VStack(alignment: .leading, spacing: 2) {
                if renamingId == session.id {
                    TextField("", text: $draft, prompt: Text("Name this session").foregroundStyle(Theme.inkLight.opacity(0.8)))
                        .font(NFont.inter(13))
                        .foregroundStyle(Theme.ink)
                        .textFieldStyle(.plain)
                        .focused($nameFocused)
                        .submitLabel(.done)
                        .onSubmit { rename(session) }
                } else {
                    Text(session.notes.isEmpty ? "Tap to name" : session.notes)
                        .font(NFont.inter(13))
                        .foregroundStyle(session.notes.isEmpty ? Theme.inkLight : Theme.ink)
                        .lineLimit(1)
                }
                Text("SAVED \(when.formatted(date: .omitted, time: .shortened))").caps(9).foregroundStyle(Theme.inkLight)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture {
                guard renamingId != session.id else { return }
                draft = session.notes
                renamingId = session.id
                nameFocused = true
            }
            .accessibilityHint("Tap to rename")
            Text(Self.duration(session.minutes))
                .font(NFont.playfair(17))
                .monospacedDigit()
                .foregroundStyle(Theme.ink)
            Button { deleting = session } label: {
                Icon(.close, size: 12)
                    .foregroundStyle(tint.label)
                    .frame(width: 32, height: 32)
                    .background(tint.opacity(0.15), in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Delete session")
        }
        .padding(EdgeInsets(top: 0, leading: 12, bottom: 0, trailing: 8))
        .frame(height: 52)
        .card()
    }

    private func rename(_ session: SessionLog) {
        let name = draft.trimmingCharacters(in: .whitespaces)
        renamingId = nil
        nameFocused = false
        guard name != session.notes else { return }
        var updated = session
        updated.notes = name
        Task {
            if await store.updateSession(updated), let i = sessions.firstIndex(where: { $0.id == session.id }) {
                sessions[i] = updated
            }
        }
    }

    private func summary(_ total: Int) -> String {
        if sessions.isEmpty { return "NO SESSIONS YET" }
        let count = sessions.count == 1 ? "1 SESSION" : "\(sessions.count) SESSIONS"
        return "\(count) · \(Self.duration(total)) TOTAL"
    }

    private struct MonthGroup {
        let title: String
        var sessions: [SessionLog]
    }

    private var groups: [MonthGroup] {
        let thisYear = Calendar.current.component(.year, from: .now)
        var result: [MonthGroup] = []
        for session in sessions {
            let date = Self.date(session)
            let year = Calendar.current.component(.year, from: date)
            let title = Self.format(date, year == thisYear ? "MMMM" : "MMMM yyyy")
            if let last = result.indices.last, result[last].title == title {
                result[last].sessions.append(session)
            } else {
                result.append(MonthGroup(title: title, sessions: [session]))
            }
        }
        return result
    }

    /// "0:42", "1:58"
    private static func duration(_ minutes: Int) -> String {
        String(format: "%d:%02d", minutes / 60, minutes % 60)
    }

    private static func date(_ session: SessionLog) -> Date {
        if session.createdAt > 0 { return Date(timeIntervalSince1970: session.createdAt / 1000) }
        return DueDate.parse(session.date) ?? .now
    }

    private static func format(_ date: Date, _ pattern: String) -> String {
        let f = DateFormatter()
        f.dateFormat = pattern
        return f.string(from: date)
    }
}
#endif
