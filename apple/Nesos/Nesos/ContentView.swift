import SwiftUI
#if canImport(UIKit)
import UIKit
#endif
#if os(macOS)
import AppKit
#endif

/// Decides what to show: sign-in, the iPhone quick-capture app,
/// or the desktop planner on Mac and iPad.
struct ContentView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(PlannerStore.self) private var store
    @Environment(QuickAddRouter.self) private var router

    var body: some View {
        @Bindable var router = router

        Group {
            if !auth.isSignedIn {
                SignInView()
            } else if Self.usesDesktopPlanner {
                DesktopPlannerView()
            } else {
                TodayView()
            }
        }
        .sheet(item: $router.sheet) { sheet in
            Group {
                switch sheet {
                case .task: QuickAddTaskView()
                case .note: QuickAddNoteView()
                case .project: QuickAddProjectView()
                case .settings: SettingsView()
                }
            }
            .environment(auth)
            .environment(store)
            .environment(router)
            .tint(Theme.accent)
        }
        .onChange(of: auth.isSignedIn) { _, signedIn in
            if !signedIn { router.sheet = nil }
        }
    }

    static var usesDesktopPlanner: Bool {
        #if os(macOS)
        true
        #else
        UIDevice.current.userInterfaceIdiom == .pad
        #endif
    }
}
