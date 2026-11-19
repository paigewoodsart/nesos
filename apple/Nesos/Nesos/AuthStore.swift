import Foundation
import Observation

/// Holds the signed-in state. The bearer token comes back from
/// /api/auth/mobile-callback via nesos://auth-callback?token=...&session_token=...
@Observable
final class AuthStore {
    private(set) var token: String?
    private(set) var email: String?
    private(set) var name: String?

    /// Guest mode for testing: data stays on this device. Remove before launch
    /// if it's no longer wanted (SignInView has the button).
    private(set) var isGuest: Bool

    /// One-time token (60 seconds) that signs the Mac/iPad planner window in.
    var pendingSessionToken: String?

    var isSignedIn: Bool { token != nil }

    /// The person's first name, when the account has a real one. Apple
    /// sign-in with a hidden email has no name (the "name" is the made-up
    /// address), so this is nil and screens fall back to a plain greeting.
    var firstName: String? {
        guard !isGuest, let name, !name.contains("@"),
              let first = name.split(separator: " ").first else { return nil }
        return String(first)
    }

    /// True when Apple is hiding the person's email behind a relay address.
    var hidesEmail: Bool { email?.hasSuffix("@privaterelay.appleid.com") ?? false }
    var hasSession: Bool { isSignedIn || isGuest }

    private static let guestKey = "nesos-guest-mode"

    init() {
        isGuest = UserDefaults.standard.bool(forKey: Self.guestKey)
        if let saved = Keychain.read(), let claims = JWT.claims(saved), !JWT.isExpired(claims) {
            token = saved
            email = claims["email"] as? String
            name = claims["name"] as? String
        } else {
            Keychain.delete()
        }
    }

    func handleCallback(_ url: URL) throws {
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        guard let token = items.first(where: { $0.name == "token" })?.value,
              let claims = JWT.claims(token) else {
            throw AuthError.badCallback
        }
        Keychain.save(token)
        setGuest(false)
        self.token = token
        self.email = claims["email"] as? String
        self.name = claims["name"] as? String
        self.pendingSessionToken = items.first(where: { $0.name == "session_token" })?.value
    }

    func continueAsGuest() { setGuest(true) }

    func signOut() {
        Keychain.delete()
        token = nil
        email = nil
        name = nil
        pendingSessionToken = nil
        setGuest(false)
    }

    private func setGuest(_ value: Bool) {
        isGuest = value
        UserDefaults.standard.set(value, forKey: Self.guestKey)
    }
}

enum AuthError: LocalizedError {
    case badCallback
    var errorDescription: String? { "Sign-in didn't finish. Please try again." }
}

/// Reads (does not verify) the token's payload. The server verifies it.
enum JWT {
    static func claims(_ jwt: String) -> [String: Any]? {
        let parts = jwt.split(separator: ".")
        guard parts.count == 3 else { return nil }
        var b64 = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while b64.count % 4 != 0 { b64 += "=" }
        guard let data = Data(base64Encoded: b64) else { return nil }
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }

    static func isExpired(_ claims: [String: Any]) -> Bool {
        guard let exp = claims["exp"] as? Double else { return false }
        return Date(timeIntervalSince1970: exp) < .now
    }
}
