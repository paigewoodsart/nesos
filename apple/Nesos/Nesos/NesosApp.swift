import SwiftUI
#if canImport(UIKit)
import UIKit
#endif
#if os(macOS)
import AppKit
#endif

@main
struct NesosApp: App {
    @State private var auth: AuthStore
    @State private var store: AppStore
    @State private var timers = TimerStore()
    @State private var router = QuickAddRouter()

    init() {
        NFont.register()
        let auth = AuthStore()
        _auth = State(initialValue: auth)
        _store = State(initialValue: AppStore(auth: auth))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(auth)
                .environment(store)
                .environment(timers)
                .environment(router)
                .tint(Theme.accent)
                .preferredColorScheme(.light)
                #if os(macOS)
                .frame(minWidth: 900, minHeight: 600)
                #endif
        }
        .commands {
            // File menu: New Task (Cmd+N), New Project (Cmd+Shift+N).
            // Also works with a keyboard on iPad.
            CommandGroup(replacing: .newItem) {
                Button("New Task") { router.sheet = .task }
                    .keyboardShortcut("n")
                    .disabled(!auth.isSignedIn)
                Button("New Project") { router.sheet = .project }
                    .keyboardShortcut("n", modifiers: [.command, .shift])
                    .disabled(!auth.isSignedIn)
            }
        }

        #if os(macOS)
        Settings {
            AccountSheet(showsDone: false)
                .environment(auth)
                .environment(store)
                .tint(Theme.accent)
        }

        // Menu bar item for quick add from anywhere on the Mac.
        MenuBarExtra("Nesos", systemImage: "plus.circle") {
            Button("New Task") { open(.task) }
                .disabled(!auth.isSignedIn)
            Button("New Project") { open(.project) }
                .disabled(!auth.isSignedIn)
            Divider()
            Button("Quit Nesos") { NSApplication.shared.terminate(nil) }
        }
        #endif
    }

    #if os(macOS)
    private func open(_ sheet: AppSheet) {
        NSApplication.shared.activate()
        router.sheet = sheet
    }
    #endif
}
