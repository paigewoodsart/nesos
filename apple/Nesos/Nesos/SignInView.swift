import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.webAuthenticationSession) private var webAuthenticationSession
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            Theme.islandGradient.ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer()

                VStack(spacing: 8) {
                    Text("nesos")
                        .font(.system(size: 52, weight: .light, design: .serif))
                        .foregroundStyle(Theme.ink)
                    Text("Sign in to your planner")
                        .font(.subheadline)
                        .foregroundStyle(Theme.inkLight)
                }

                Spacer()

                VStack(spacing: 12) {
                    signInButton("Continue with Google", systemImage: "globe", provider: "google")
                    signInButton("Continue with Apple", systemImage: "apple.logo", provider: "apple")
                }
                .disabled(busy)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                Link("Privacy policy", destination: Config.privacyURL)
                    .font(.footnote)
                    .foregroundStyle(Theme.inkLight)
                    .padding(.bottom, 8)
            }
            .padding(32)
            .frame(maxWidth: 420)
        }
    }

    private func signInButton(_ title: String, systemImage: String, provider: String) -> some View {
        Button {
            Task { await signIn(provider: provider) }
        } label: {
            Label(title, systemImage: systemImage)
                .font(.body.weight(.medium))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(.white, in: Capsule())
                .foregroundStyle(Theme.ink)
                .overlay(Capsule().stroke(Theme.line))
        }
        .buttonStyle(.plain)
    }

    /// Opens sign-in in the system browser sheet (Google blocks sign-in inside
    /// app web views), then reads the tokens from nesos://auth-callback.
    private func signIn(provider: String) async {
        busy = true
        defer { busy = false }
        errorMessage = nil
        var components = URLComponents(
            url: Config.baseURL.appending(path: "api/auth/mobile-start"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [URLQueryItem(name: "provider", value: provider)]
        do {
            let callback = try await webAuthenticationSession.authenticate(
                using: components.url!,
                callbackURLScheme: Config.callbackScheme,
                preferredBrowserSession: .shared
            )
            try auth.handleCallback(callback)
        } catch let error as ASWebAuthenticationSessionError where error.code == .canceledLogin {
            // The person closed the sign-in sheet. Nothing to show.
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
