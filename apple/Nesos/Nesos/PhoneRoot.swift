#if os(iOS)
import SwiftUI
import UIKit

/// Screens on the phone.
enum Route: Hashable {
    case project(String, adding: Bool)
    case due(DueSection, adding: Bool)
    case archive(String)
    case sessions(String)
    case profile
}

/// The iPhone app: home with project tiles, plus project, due, archive and
/// profile screens.
struct PhoneRoot: View {
    @Environment(AppStore.self) private var store
    @Environment(\.scenePhase) private var scenePhase
    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(path: $path)
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case let .project(id, adding):
                        ProjectView(projectId: id, startAdding: adding, path: $path)
                    case let .due(section, adding):
                        DueView(start: section, startAdding: adding, path: $path)
                    case let .archive(id):
                        ArchiveView(projectId: id, path: $path)
                    case let .sessions(id):
                        TimerLogView(projectId: id, path: $path)
                    case .profile:
                        ProfileView(path: $path)
                    }
                }
        }
        .task { await store.load() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { Task { await store.load() } }
        }
    }
}

/// Shared frame for every phone screen: padding, background, no nav bar.
struct Screen<Content: View>: View {
    @Environment(AppStore.self) private var store
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) { content }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 8)
            .frame(maxWidth: 560, maxHeight: .infinity, alignment: .top)
            .frame(maxWidth: .infinity)
            .background(BoardBackground(theme: store.theme, customColor: store.customColor))
            .toolbar(.hidden, for: .navigationBar)
            .overlay(alignment: .bottom) {
                if let message = store.errorMessage {
                    ErrorBanner(message: message) { store.errorMessage = nil }
                        .padding(.bottom, 12)
                        .transition(.opacity)
                }
            }
            .animation(.easeOut(duration: 0.2), value: store.errorMessage)
            .task(id: store.errorMessage) {
                guard store.errorMessage != nil else { return }
                try? await Task.sleep(for: .seconds(4))
                if !Task.isCancelled { store.errorMessage = nil }
            }
    }
}

/// Keeps swipe-back working with the navigation bar hidden.
extension UINavigationController: @retroactive UIGestureRecognizerDelegate {
    override open func viewDidLoad() {
        super.viewDidLoad()
        interactivePopGestureRecognizer?.delegate = self
    }

    public func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        viewControllers.count > 1
    }
}

// MARK: - Home

struct HomeView: View {
    @Binding var path: [Route]
    @Environment(AppStore.self) private var store
    @State private var adding = false
    @State private var keyboardUp = false

    init(path: Binding<[Route]>) {
        _path = path
    }

    var body: some View {
        Screen {
            HomeBanner { path.append(.profile) }

            HStack(spacing: 10) {
                ForEach(DueSection.allCases) { section in
                    DueTile(section: section, count: store.count(section)) {
                        path.append(.due(section, adding: false))
                    } onAdd: {
                        path.append(.due(section, adding: true))
                    }
                }
            }

            SectionHeader(title: "PROJECTS", isOpen: adding) {
                withAnimation(.easeOut(duration: 0.2)) { adding.toggle() }
            }

            if adding {
                ProjectEditCard(project: nil) { _ in
                    withAnimation(.easeOut(duration: 0.2)) { adding = false }
                }
                .padding(.trailing, 13)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            if store.loaded && store.projects.isEmpty {
                if !adding {
                    FirstRunTile { withAnimation(.easeOut(duration: 0.2)) { adding = true } }
                        .frame(maxHeight: .infinity, alignment: .top)
                } else {
                    Spacer(minLength: 0)
                }
            } else {
                BarScroll {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                        ForEach(store.projects) { project in
                            ProjectTile(project: project, count: store.openCount(project.id)) {
                                path.append(.project(project.id, adding: false))
                            } onAdd: {
                                path.append(.project(project.id, adding: true))
                            }
                        }
                    }
                    .padding(.bottom, 22)
                }
                .scrollFade()
                .frame(maxHeight: .infinity)
                .overlay {
                    if !store.loaded { ProgressView().tint(Theme.accent) }
                }
                .refreshable { await store.load() }
            }

            if !keyboardUp {
                QuoteDateRow()
                    .padding(.top, -13)
            }
        }
        .trackKeyboard($keyboardUp)
    }
}

/// The heading banner on home: the N, a greeting and the profile button,
/// on the person's own color at 70% so the board shows through.
struct HomeBanner: View {
    let onProfile: () -> Void

    @Environment(AuthStore.self) private var auth
    @Environment(AppStore.self) private var store

    init(onProfile: @escaping () -> Void) {
        self.onProfile = onProfile
    }

    var body: some View {
        let ink = Palette.bannerText(on: store.personalColor, darkBoard: store.boardIsDark)
        HStack(spacing: 12) {
            // The N takes the same width as the profile button, so the
            // greeting sits in the true middle of the banner.
            NMark()
                .fill(ink)
                .frame(width: 18, height: 22)
                .frame(width: 34, alignment: .leading)
                .accessibilityHidden(true)
            TimelineView(.everyMinute) { context in
                Text(greeting(at: context.date))
                    .font(NFont.playfair(17))
                    .foregroundStyle(ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            Button(action: onProfile) {
                Icon(.person, size: 18)
                    .foregroundStyle(ink)
                    .frame(width: 38, height: 38)
                    .background(Color.white.opacity(0.3), in: Circle())
                    .overlay(Circle().stroke(Color.white.opacity(0.6), lineWidth: 1))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Account")
        }
        .padding(.leading, 16)
        .padding(.trailing, 6)
        .frame(height: 56)
        .background(store.palette.base.opacity(0.7), in: RoundedRectangle(cornerRadius: 7))
    }

    /// "Good morning, Paige". Guests and accounts with no name get no name.
    private func greeting(at date: Date) -> String {
        let hour = Calendar.current.component(.hour, from: date)
        let part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
        guard !auth.isGuest, let first = auth.name?.split(separator: " ").first else { return part }
        return "\(part), \(first)"
    }
}

/// OVERDUE / TODAY / THIS WEEK tiles on home.
struct DueTile: View {
    @Environment(AppStore.self) private var store
    let section: DueSection
    let count: Int
    let onOpen: () -> Void
    let onAdd: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(section.title).caps(10).lineLimit(1).minimumScaleFactor(0.8)
                .padding(EdgeInsets(top: 12, leading: 12, bottom: 0, trailing: 12))
            Spacer(minLength: 0)
            TileBar(leading: 12, trailing: 0) {
                Text("\(count)").caps(10)
                Spacer(minLength: 0)
                PlusButton(label: "Add to \(section.title)", action: onAdd)
            }
        }
        .foregroundStyle(store.palette.text(section))
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 64)
        .background(store.palette.color(section))
        .clipShape(RoundedRectangle(cornerRadius: 7))
        .contentShape(RoundedRectangle(cornerRadius: 7))
        .onTapGesture(perform: onOpen)
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel("\(section.title), \(count)")
    }
}

/// The + at the right end of a tile band.
struct PlusButton: View {
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Icon(.plus, size: 14)
                .frame(width: 36, height: 24)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

struct ProjectTile: View {
    let project: Project
    let count: Int
    let onOpen: () -> Void
    let onAdd: () -> Void

    var body: some View {
        let tint = Tint(project.color)
        VStack(alignment: .leading, spacing: 0) {
            Text(project.name).caps(12).lineLimit(2).minimumScaleFactor(0.85)
                .padding(EdgeInsets(top: 14, leading: 14, bottom: 0, trailing: 10))
            Spacer(minLength: 0)
            TileBar(leading: 14, trailing: 2) {
                Text(count == 1 ? "1 TASK" : "\(count) TASKS").caps(10)
                Spacer(minLength: 0)
                PlusButton(label: "Add a task to \(project.name)", action: onAdd)
            }
        }
        .foregroundStyle(tint.onFill)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 84)
        .background(tint.fill)
        .clipShape(RoundedRectangle(cornerRadius: 7))
        .contentShape(RoundedRectangle(cornerRadius: 7))
        .onTapGesture(perform: onOpen)
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel("\(project.name), \(count) open tasks")
    }
}

/// Shown on home before the first project exists.
struct FirstRunTile: View {
    let onAdd: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            Button(action: onAdd) {
                VStack(spacing: 12) {
                    Icon(.plus, size: 18)
                        .foregroundStyle(Theme.onAccent)
                        .frame(width: 44, height: 44)
                        .background(Theme.accent, in: Circle())
                    Text("ADD YOUR FIRST PROJECT").caps(12, spacing: 0.24).foregroundStyle(Theme.accent)
                    Text("A client, a goal, or anything you’re juggling.")
                        .font(NFont.inter(12))
                        .foregroundStyle(Theme.inkLight)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 178)
                .background(Theme.card, in: RoundedRectangle(cornerRadius: 7))
                .overlay(RoundedRectangle(cornerRadius: 7).stroke(Theme.accent.opacity(0.35), style: StrokeStyle(lineWidth: 1.5, dash: [5, 4])))
            }
            .buttonStyle(.plain)

            HStack(spacing: 10) {
                ForEach(0..<2, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 7)
                        .stroke(Theme.accent.opacity(0.22), style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
                        .frame(height: 84)
                }
            }
            .opacity(0.5)
        }
        .padding(.trailing, 13)
    }
}
#endif
