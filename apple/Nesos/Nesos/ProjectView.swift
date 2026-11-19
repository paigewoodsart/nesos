#if os(iOS)
import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

/// One project: timer, tasks, notes, files and its archive.
struct ProjectView: View {
    let projectId: String
    @Binding var path: [Route]

    @Environment(AppStore.self) private var store
    @Environment(TimerStore.self) private var timers
    @State private var adding: Bool
    @State private var editingId: String?
    @State private var editingProject = false
    @State private var notes = ""
    @State private var notesLoaded = false
    @State private var saveTask: Task<Void, Never>?
    @State private var keyboardUp = false
    @State private var fileCount: Int?
    @State private var showAttachChoice = false
    @State private var showPhotoPicker = false
    @State private var showFileImporter = false
    @State private var photoItem: PhotosPickerItem?
    @State private var uploading = false
    @AppStorage private var sessionNote: String
    @FocusState private var notesFocused: Bool
    @FocusState private var sessionFocused: Bool

    init(projectId: String, startAdding: Bool, path: Binding<[Route]>) {
        self.projectId = projectId
        _path = path
        _adding = State(initialValue: startAdding)
        _sessionNote = AppStorage(wrappedValue: "", "nesos-session-note-\(projectId)")
    }

    var body: some View {
        Screen {
            HeaderBar(onBack: { path.removeLast() }, onAccount: { path.append(.profile) })

            if let project = store.project(projectId) {
                content(project, tint: Tint(project.color))
            } else {
                Spacer()
            }
        }
        .trackKeyboard($keyboardUp)
        .task {
            await store.refreshArchivedCount(projectId)
            fileCount = await store.fileCount(projectId)
        }
        .onAppear {
            if !notesLoaded {
                notes = store.project(projectId)?.notes ?? ""
                notesLoaded = true
            }
        }
        .onDisappear { flushNotes() }
        .confirmationDialog("Attach a file", isPresented: $showAttachChoice, titleVisibility: .visible) {
            Button("Photo Library") { showPhotoPicker = true }
            Button("Files") { showFileImporter = true }
        }
        .photosPicker(isPresented: $showPhotoPicker, selection: $photoItem, matching: .images)
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            photoItem = nil
            Task { await upload(photo: item) }
        }
        .fileImporter(isPresented: $showFileImporter, allowedContentTypes: [.item]) { result in
            if case let .success(url) = result { Task { await upload(file: url) } }
        }
    }

    @ViewBuilder private func content(_ project: Project, tint: Tint) -> some View {
        let running = timers.entries[projectId] != nil
        let tasks = store.tasks(for: projectId)

        headerTile(project, tint: tint, running: running)

        if running && !(keyboardUp && !sessionFocused) {
            sessionNoteField(tint)
        }

        if editingProject {
            ProjectEditCard(project: project) { _ in
                withAnimation(.easeOut(duration: 0.2)) { editingProject = false }
            }
            .padding(.trailing, 13)
        }

        if !notesFocused {
            SectionHeader(title: "TASKS", isOpen: adding, addColor: tint.strong) {
                withAnimation(.easeOut(duration: 0.2)) {
                    adding.toggle()
                    editingId = nil
                    editingProject = false
                }
            }

            if adding {
                TaskEditCard(mode: .new, projectId: projectId, defaultDue: nil) {
                    withAnimation(.easeOut(duration: 0.2)) { adding = false }
                }
                .padding(.trailing, 13)
            }

            BarScroll {
                LazyVStack(spacing: 6) {
                    if tasks.isEmpty && !adding {
                        Text("No tasks yet. Tap ADD to start.")
                            .font(NFont.inter(13))
                            .foregroundStyle(Theme.inkLight)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 12)
                    }
                    ForEach(tasks) { task in
                        if editingId == task.id {
                            TaskEditCard(mode: .edit(task), projectId: projectId) {
                                withAnimation(.easeOut(duration: 0.2)) { editingId = nil }
                            }
                        } else {
                            TaskRow(task: task, tint: tint) {
                                Task { await store.toggle(task) }
                            } onTap: {
                                withAnimation(.easeOut(duration: 0.2)) {
                                    editingId = task.id
                                    adding = false
                                    editingProject = false
                                }
                            }
                        }
                    }
                }
                .padding(.bottom, 22)
            }
            .scrollFade()
            .frame(maxHeight: .infinity)
        }

        if !keyboardUp || notesFocused {
            notesCard(tint)
                .padding(.top, notesFocused ? 0 : -13)
        }

        if notesFocused {
            Spacer(minLength: 0)
        }

        if !keyboardUp {
            filesBar(tint)
                .padding(.top, -6)

            Button { path.append(.archive(projectId)) } label: {
                HStack(spacing: 7) {
                    Icon(.archive, size: 13)
                    Text(archiveLabel).caps(9, spacing: 0.24)
                }
                .foregroundStyle(Theme.inkSoft)
                .frame(width: 168, height: 36)
                .frosted()
            }
            .buttonStyle(.plain)
            .frame(maxWidth: .infinity)
            .padding(.top, 2)
        }
    }

    // MARK: Header tile and timer

    private func headerTile(_ project: Project, tint: Tint, running: Bool) -> some View {
        let open = store.openCount(projectId)
        let overdue = store.overdueCount(projectId)
        return VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(project.name).caps(16, spacing: 0.24).lineLimit(1).minimumScaleFactor(0.7)
                    if running {
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            Text(TimerStore.format(timers.elapsed(projectId, now: context.date)))
                                .font(NFont.playfair(34))
                                .monospacedDigit()
                        }
                    }
                }
                Spacer(minLength: 8)
                timerButton(tint: tint, running: running)
            }
            .padding(EdgeInsets(top: 16, leading: 16, bottom: 0, trailing: 12))
            Spacer(minLength: 0)
            TileBar(height: 28, leading: 16, trailing: 6) {
                if running, let since = timers.runningSince(projectId) {
                    Circle().fill(tint.onFill).frame(width: 7, height: 7)
                    Text("RUNNING SINCE \(since.formatted(date: .omitted, time: .shortened))").caps(10).lineLimit(1)
                } else {
                    Text(summary(open: open, overdue: overdue)).caps(10).lineLimit(1)
                }
                Spacer(minLength: 0)
                Button {
                    withAnimation(.easeOut(duration: 0.2)) {
                        editingProject.toggle()
                        adding = false
                        editingId = nil
                    }
                } label: {
                    Icon(editingProject ? .close : .pencil, size: 14)
                        .frame(width: 32, height: 28)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Edit project")
            }
        }
        .foregroundStyle(tint.onFill)
        .frame(height: running ? 132 : 96)
        .background(tint.fill)
        .clipShape(RoundedRectangle(cornerRadius: 7))
    }

    private func timerButton(tint: Tint, running: Bool) -> some View {
        Button {
            if running {
                let note = sessionNote
                sessionNote = ""
                sessionFocused = false
                Task { await timers.stop(projectId, note: note, store: store) }
            } else {
                withAnimation(.easeOut(duration: 0.2)) { timers.start(projectId) }
            }
        } label: {
            HStack(spacing: 6) {
                Icon(running ? .stop : .play, size: 10)
                Text(running ? "STOP" : "TIMER").caps(10)
            }
            .foregroundStyle(running ? tint.label : tint.onFill)
            .padding(.horizontal, 12)
            .frame(height: 30)
            .background(running ? Color.white : Color.white.opacity(0.25), in: Capsule())
        }
        .buttonStyle(.plain)
    }

    private func sessionNoteField(_ tint: Tint) -> some View {
        HStack(spacing: 10) {
            Text("SESSION NOTE").caps(10).foregroundStyle(tint.label)
            TextField("", text: $sessionNote, prompt: Text("What are you working on?").foregroundStyle(Theme.inkLight.opacity(0.8)))
                .font(NFont.inter(13))
                .foregroundStyle(Theme.ink)
                .textFieldStyle(.plain)
                .focused($sessionFocused)
                .submitLabel(.done)
        }
        .padding(.horizontal, 12)
        .frame(height: 44)
        .card()
        .padding(.trailing, 13)
    }

    private func summary(open: Int, overdue: Int) -> String {
        let tasks = open == 1 ? "1 TASK" : "\(open) TASKS"
        return overdue > 0 ? "\(tasks) · \(overdue) OVERDUE" : tasks
    }

    private var archiveLabel: String {
        guard let count = store.archivedCounts[projectId] else { return "ARCHIVE" }
        return "\(count) ARCHIVED"
    }

    // MARK: Notes

    private func notesCard(_ tint: Tint) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text("NOTES").caps(10).foregroundStyle(tint.label)
                Spacer()
                if notesFocused {
                    Button {
                        notesFocused = false
                        flushNotes()
                    } label: {
                        Text("DONE").caps(10).foregroundStyle(tint.label)
                            .frame(height: 26)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .frame(height: 26)
            .background(tint.opacity(0.18))

            TextEditor(text: $notes)
                .font(NFont.inter(13))
                .foregroundStyle(Theme.ink)
                .scrollContentBackground(.hidden)
                .focused($notesFocused)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .overlay(alignment: .topLeading) {
                    if notes.isEmpty && !notesFocused {
                        Text("Tap to add notes")
                            .font(NFont.inter(13))
                            .foregroundStyle(Theme.inkLight.opacity(0.8))
                            .padding(EdgeInsets(top: 10, leading: 13, bottom: 0, trailing: 0))
                            .allowsHitTesting(false)
                    }
                }
        }
        .frame(height: notesFocused ? 220 : 132)
        .card()
        .clipShape(RoundedRectangle(cornerRadius: 7))
        .padding(.trailing, 13)
        .onChange(of: notes) { _, _ in
            guard notesLoaded else { return }
            saveTask?.cancel()
            saveTask = Task {
                try? await Task.sleep(for: .seconds(1))
                if !Task.isCancelled { await store.saveNotes(projectId, notes) }
            }
        }
    }

    private func flushNotes() {
        guard notesLoaded else { return }
        saveTask?.cancel()
        let text = notes
        Task { await store.saveNotes(projectId, text) }
    }

    // MARK: Files

    private func filesBar(_ tint: Tint) -> some View {
        Button { showAttachChoice = true } label: {
            HStack(spacing: 10) {
                Text("FILES").caps(10)
                Text(filesLabel).font(NFont.inter(11)).opacity(0.9)
                Spacer(minLength: 0)
                if uploading {
                    ProgressView().tint(tint.onFill)
                } else {
                    Text("ATTACH").caps(10)
                    Icon(.plus, size: 13)
                }
            }
            .foregroundStyle(tint.onFill)
            .padding(.horizontal, 12)
            .frame(height: 40)
            .background(tint.fill, in: RoundedRectangle(cornerRadius: 7))
        }
        .buttonStyle(.plain)
        .disabled(uploading)
        .padding(.trailing, 13)
    }

    private var filesLabel: String {
        switch fileCount {
        case nil: ""
        case 0?: "No files yet"
        case 1?: "1 file"
        case let count?: "\(count) files"
        }
    }

    private func upload(photo item: PhotosPickerItem) async {
        uploading = true
        defer { uploading = false }
        guard let data = try? await item.loadTransferable(type: Data.self) else {
            store.errorMessage = "That photo couldn't be read."
            return
        }
        let type = item.supportedContentTypes.first ?? .jpeg
        let ext = type.preferredFilenameExtension ?? "jpg"
        let name = "photo-\(Int(Date().timeIntervalSince1970)).\(ext)"
        await finishUpload(data, name: name, mime: type.preferredMIMEType ?? "image/jpeg")
    }

    private func upload(file url: URL) async {
        uploading = true
        defer { uploading = false }
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url) else {
            store.errorMessage = "That file couldn't be read."
            return
        }
        let mime = UTType(filenameExtension: url.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        await finishUpload(data, name: url.lastPathComponent, mime: mime)
    }

    private func finishUpload(_ data: Data, name: String, mime: String) async {
        if await store.upload(data, fileName: name, mimeType: mime, projectId: projectId) {
            fileCount = await store.fileCount(projectId)
        }
    }
}

// MARK: - Archive

/// A project's finished tasks, searchable, with restore.
struct ArchiveView: View {
    let projectId: String
    @Binding var path: [Route]

    @Environment(AppStore.self) private var store
    @State private var items: [ProjectTask] = []
    @State private var loaded = false
    @State private var query = ""

    init(projectId: String, path: Binding<[Route]>) {
        self.projectId = projectId
        _path = path
    }

    var body: some View {
        let project = store.project(projectId)
        let tint = Tint(project?.color ?? "#6a95a8")

        Screen {
            HeaderBar(onBack: { path.removeLast() }, onAccount: { path.append(.profile) })

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(project?.name ?? "").caps(16, spacing: 0.24).lineLimit(1).minimumScaleFactor(0.7)
                    Spacer(minLength: 8)
                    Text("ARCHIVE").caps(10)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.25), in: Capsule())
                }
                .padding(EdgeInsets(top: 16, leading: 16, bottom: 0, trailing: 12))
                Spacer(minLength: 0)
                TileBar(height: 28, leading: 16, trailing: 12) {
                    Text("\(items.count) DONE · \(store.openCount(projectId)) STILL OPEN").caps(10).lineLimit(1)
                    Spacer(minLength: 0)
                }
            }
            .foregroundStyle(tint.onFill)
            .frame(height: 96)
            .background(tint.fill)
            .clipShape(RoundedRectangle(cornerRadius: 7))

            HStack(spacing: 8) {
                Icon(.search, size: 15).foregroundStyle(Theme.inkLight)
                TextField("", text: $query, prompt: Text("Search \(project?.name ?? "the") archive").foregroundStyle(Theme.inkLight.opacity(0.8)))
                    .font(NFont.inter(13))
                    .foregroundStyle(Theme.ink)
                    .textFieldStyle(.plain)
                    .autocorrectionDisabled()
            }
            .padding(.horizontal, 12)
            .frame(height: 40)
            .card()
            .padding(.trailing, 13)

            BarScroll {
                LazyVStack(alignment: .leading, spacing: 6) {
                    if loaded && groups.isEmpty {
                        Text(query.isEmpty ? "Nothing archived yet. Finished tasks land here after a day." : "No matches.")
                            .font(NFont.inter(13))
                            .foregroundStyle(Theme.inkLight)
                            .padding(.vertical, 12)
                    }
                    ForEach(groups, id: \.title) { group in
                        Text(group.title).caps(10, spacing: 0.24)
                            .foregroundStyle(Theme.inkSoft)
                            .padding(EdgeInsets(top: 6, leading: 2, bottom: 2, trailing: 0))
                        ForEach(group.tasks) { task in
                            row(task, tint: tint)
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
            items = await store.archivedTasks(projectId)
            loaded = true
        }
    }

    private func row(_ task: ProjectTask, tint: Tint) -> some View {
        HStack(spacing: 10) {
            CheckCircle(done: true, tint: tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(task.text).font(NFont.inter(13)).foregroundStyle(Theme.inkSoft).lineLimit(1)
                Text("DONE \(Self.format(Self.date(task), "MMM d"))").caps(9).foregroundStyle(Theme.inkLight)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Button {
                Task {
                    if await store.restore(task) {
                        withAnimation(.easeOut(duration: 0.2)) { items.removeAll { $0.id == task.id } }
                    }
                }
            } label: {
                Icon(.restore, size: 14)
                    .foregroundStyle(tint.label)
                    .frame(width: 32, height: 32)
                    .background(tint.opacity(0.15), in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Restore task")
        }
        .padding(EdgeInsets(top: 0, leading: 12, bottom: 0, trailing: 8))
        .frame(height: 52)
        .card(0.45, border: Color.white.opacity(0.75))
    }

    private struct MonthGroup {
        let title: String
        var tasks: [ProjectTask]
    }

    private var groups: [MonthGroup] {
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        let filtered = needle.isEmpty ? items : items.filter { $0.text.lowercased().contains(needle) }
        let thisYear = Calendar.current.component(.year, from: .now)
        var result: [MonthGroup] = []
        for task in filtered.sorted(by: { Self.date($0) > Self.date($1) }) {
            let date = Self.date(task)
            let year = Calendar.current.component(.year, from: date)
            let title = Self.format(date, year == thisYear ? "MMMM" : "MMMM yyyy")
            if let last = result.indices.last, result[last].title == title {
                result[last].tasks.append(task)
            } else {
                result.append(MonthGroup(title: title, tasks: [task]))
            }
        }
        return result
    }

    private static func date(_ task: ProjectTask) -> Date {
        Date(timeIntervalSince1970: (task.doneAt ?? task.archivedAt ?? task.createdAt) / 1000)
    }

    private static func format(_ date: Date, _ pattern: String) -> String {
        let f = DateFormatter()
        f.dateFormat = pattern
        return f.string(from: date)
    }
}
#endif
