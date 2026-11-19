import SwiftUI
#if canImport(UIKit)
import UIKit
#endif
#if os(macOS)
import AppKit
#endif

/// Decides what to show: sign-in, the iPhone app, or the desktop planner on
/// Mac and iPad.
struct ContentView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(AppStore.self) private var store
    @Environment(QuickAddRouter.self) private var router

    var body: some View {
        @Bindable var router = router

        Group {
            if !auth.hasSession {
                SignInView()
            } else {
                signedIn
            }
        }
        .sheet(item: $router.sheet) { sheet in
            Group {
                switch sheet {
                case .task: QuickTaskSheet()
                case .project: QuickProjectSheet()
                case .settings: AccountSheet()
                }
            }
            .environment(auth)
            .environment(store)
            .environment(router)
            .tint(Theme.accent)
        }
        .preferredColorScheme(auth.hasSession && showsPhoneApp && store.boardIsDark ? .dark : .light)
        .onChange(of: auth.hasSession) { _, has in
            if !has {
                router.sheet = nil
                store.reset()
            }
        }
    }

    /// iPad shows the desktop planner. Guest mode has no website session,
    /// so a guest gets the phone app on iPad too.
    private var showsPhoneApp: Bool {
        #if os(macOS)
        false
        #else
        UIDevice.current.userInterfaceIdiom != .pad || auth.isGuest
        #endif
    }

    @ViewBuilder private var signedIn: some View {
        #if os(macOS)
        DesktopPlannerView()
        #else
        if showsPhoneApp {
            PhoneRoot()
        } else {
            DesktopPlannerView()
        }
        #endif
    }
}
