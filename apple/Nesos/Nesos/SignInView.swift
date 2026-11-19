import SwiftUI
import AuthenticationServices
#if canImport(UIKit)
import UIKit
#endif

struct SignInView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.webAuthenticationSession) private var webAuthenticationSession
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            BoardBackground(theme: "original", customColor: "#EBE5DE")

            VStack(spacing: 10) {
                Spacer()

                Text("NESOS")
                    .font(NFont.aboreto(44))
                    .tracking(44 * 0.12)
                    .foregroundStyle(Theme.ocean)
                Text("YOUR WORK, YOUR RHYTHM, YOUR ISLAND.")
                    .caps(10, spacing: 0.28, weight: .regular)
                    .foregroundStyle(Theme.ocean.opacity(0.8))
                    .multilineTextAlignment(.center)

                VStack(spacing: 10) {
                    signInButton("SIGN IN WITH GOOGLE", provider: "google", background: Theme.ocean, showsApple: false)
                    signInButton("SIGN IN WITH APPLE", provider: "apple", background: .black, showsApple: true)

                    #if os(iOS)
                    // Guest mode is for testing. Delete this button to remove it.
                    Button { auth.continueAsGuest() } label: {
                        Text("CONTINUE AS GUEST").caps(11, spacing: 0.26)
                            .foregroundStyle(Theme.accent)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .frosted()
                    }
                    .buttonStyle(.plain)
                    #endif
                }
                .disabled(busy)
                .padding(.top, 36)

                if let errorMessage {
                    Text(errorMessage)
                        .font(NFont.inter(12))
                        .foregroundStyle(Theme.danger)
                        .multilineTextAlignment(.center)
                        .padding(.top, 6)
                }

                Spacer()

                Link(destination: Config.privacyURL) {
                    Text("PRIVACY POLICY").caps(9, spacing: 0.24)
                        .foregroundStyle(Theme.inkSoft)
                        .frame(width: 140, height: 32)
                        .frosted()
                }
                .padding(.bottom, 20)
            }
            .padding(.horizontal, 32)
            .frame(maxWidth: 420)
        }
    }

    private func signInButton(_ title: String, provider: String, background: Color, showsApple: Bool) -> some View {
        Button {
            Task { await signIn(provider: provider) }
        } label: {
            HStack(spacing: 8) {
                if showsApple {
                    Image(systemName: "apple.logo").font(.system(size: 14, weight: .medium))
                }
                Text(title).caps(11, spacing: 0.26)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(background, in: RoundedRectangle(cornerRadius: 7))
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
