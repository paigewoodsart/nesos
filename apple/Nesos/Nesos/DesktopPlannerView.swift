import SwiftUI
import WebKit
#if canImport(UIKit)
import UIKit
#endif
#if os(macOS)
import AppKit
#endif

/// Mac and iPad: the full desktop planner from the website in a native window,
/// plus native quick add.
struct DesktopPlannerView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(QuickAddRouter.self) private var router
    @State private var startURL: URL?
    /// Planner size, changed from the View menu (Cmd +, Cmd -, Cmd 0).
    @AppStorage(PlannerZoom.key) private var zoom = PlannerZoom.standard

    var body: some View {
        Group {
            if let startURL {
                PlannerWebView(
                    startURL: startURL,
                    reloadCount: router.reloadCount,
                    zoom: zoom,
                    onNeedsSignIn: {
                        // The planner's own session ran out. Sign in again
                        // natively; that hands the window a fresh session.
                        WebSession.clear()
                        auth.signOut()
                    }
                )
                #if os(iOS)
                .ignoresSafeArea(edges: .bottom)
                .overlay(alignment: .bottomTrailing) {
                    QuickAddMenu()
                        .padding(24)
                }
                #endif
            } else {
                Theme.paper
            }
        }
        #if os(macOS)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                QuickAddMenu()
            }
        }
        #endif
        .onAppear {
            guard startURL == nil else { return }
            if let token = auth.pendingSessionToken {
                // Right after sign-in: trade the one-time token for a normal
                // website session inside this window, in desktop layout.
                var components = URLComponents(
                    url: Config.baseURL.appending(path: "api/auth/mobile-session"),
                    resolvingAgainstBaseURL: false
                )!
                components.queryItems = [
                    URLQueryItem(name: "token", value: token),
                    URLQueryItem(name: "desktop", value: "1"),
                ]
                startURL = components.url
                auth.pendingSessionToken = nil
            } else {
                startURL = Config.baseURL
            }
        }
    }
}

/// How big the planner is drawn in the Mac and iPad window, like zoom in a
/// browser. The choice is remembered on this device.
enum PlannerZoom {
    static let key = "nesos-planner-zoom"
    static let standard = 1.0
    static let steps: [Double] = [0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0]

    /// The next size up (direction 1) or down (direction -1) from `current`.
    static func next(from current: Double, direction: Int) -> Double {
        var nearest = 0
        for index in steps.indices where abs(steps[index] - current) < abs(steps[nearest] - current) {
            nearest = index
        }
        return steps[min(max(nearest + direction, 0), steps.count - 1)]
    }
}

/// The "+" menu on Mac (toolbar) and iPad (floating button).
struct QuickAddMenu: View {
    @Environment(QuickAddRouter.self) private var router

    var body: some View {
        Menu {
            Button("New Task", systemImage: "checkmark.circle") { router.sheet = .task }
            Button("New Project", systemImage: "folder") { router.sheet = .project }
            #if os(iOS)
            Divider()
            Button("Account", systemImage: "person.crop.circle") { router.sheet = .settings }
            #endif
        } label: {
            #if os(iOS)
            Image(systemName: "plus")
                .font(.title2.weight(.medium))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Theme.accent, in: Circle())
                .shadow(color: .black.opacity(0.18), radius: 8, y: 4)
            #else
            Label("Quick Add", systemImage: "plus")
            #endif
        }
        .accessibilityLabel("Quick add")
    }
}

#if os(macOS)
private typealias PlatformViewRepresentable = NSViewRepresentable
#else
private typealias PlatformViewRepresentable = UIViewRepresentable
#endif

private struct PlannerWebView: PlatformViewRepresentable {
    let startURL: URL
    let reloadCount: Int
    let zoom: Double
    let onNeedsSignIn: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onNeedsSignIn: onNeedsSignIn)
    }

    private func makeWebView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        #if os(iOS)
        config.defaultWebpagePreferences.preferredContentMode = .desktop
        #endif

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.pageZoom = zoom
        context.coordinator.lastReload = reloadCount

        // Always the desktop layout in the app (see hooks/useIsMobile.ts).
        let desktopCookie = HTTPCookie(properties: [
            .domain: Config.cookieDomain,
            .path: "/",
            .name: "nesos-desktop",
            .value: "1",
            .secure: "TRUE",
            .expires: Date().addingTimeInterval(365 * 24 * 60 * 60),
        ])
        let url = startURL
        if let desktopCookie {
            config.websiteDataStore.httpCookieStore.setCookie(desktopCookie) {
                webView.load(URLRequest(url: url))
            }
        } else {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    private func update(_ webView: WKWebView, context: Context) {
        if context.coordinator.lastReload != reloadCount {
            context.coordinator.lastReload = reloadCount
            webView.reload()
        }
        if abs(webView.pageZoom - zoom) > 0.001 {
            webView.pageZoom = zoom
        }
    }

    #if os(macOS)
    func makeNSView(context: Context) -> WKWebView { makeWebView(context: context) }
    func updateNSView(_ webView: WKWebView, context: Context) { update(webView, context: context) }
    #else
    func makeUIView(context: Context) -> WKWebView { makeWebView(context: context) }
    func updateUIView(_ webView: WKWebView, context: Context) { update(webView, context: context) }
    #endif

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let onNeedsSignIn: () -> Void
        var lastReload = 0

        init(onNeedsSignIn: @escaping () -> Void) {
            self.onNeedsSignIn = onNeedsSignIn
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction
        ) async -> WKNavigationActionPolicy {
            guard let url = navigationAction.request.url, let host = url.host else { return .allow }

            // Google and Apple block sign-in inside app web views.
            // Hand sign-in to the native flow instead.
            let isSignIn = host.hasSuffix("accounts.google.com")
                || host.hasSuffix("appleid.apple.com")
                || url.path.hasPrefix("/api/auth/signin")
            if isSignIn {
                onNeedsSignIn()
                return .cancel
            }

            // Links to other sites open in the browser, not inside the planner.
            let isNesos = host == "nesos.co" || host.hasSuffix(".nesos.co")
            if !isNesos && navigationAction.navigationType == .linkActivated {
                openExternally(url)
                return .cancel
            }
            return .allow
        }

        // target="_blank" links
        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url { openExternally(url) }
            return nil
        }

        private func openExternally(_ url: URL) {
            #if os(macOS)
            NSWorkspace.shared.open(url)
            #else
            UIApplication.shared.open(url)
            #endif
        }
    }
}
