import Foundation
import Observation

/// Holds the signed-in state. The bearer token comes back from
/// /api/auth/mobile-callback via nesos://auth-callback?token=...&session_token=...
@Observable
final class AuthStore {
    private(set) var token: String?
    private(set) var email: String?

    /// One-time token (60 seconds) that signs the Mac/iPad planner window in.
    /// Only present right after a sign-in.
    var pendingSessionToken: String?

    var isSignedIn: Bool { token != nil }

    init() {
        if let saved = Keychain.read(), let claims = JWT.claims(saved), !JWT.isExpired(claims) {
            token = saved
            email = claims["email"] as? String
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
        self.token = token
        self.email = claims["email"] as? String
        self.pendingSessionToken = items.first(where: { $0.name == "session_token" })?.value
    }

    func signOut() {
        Keychain.delete()
        token = nil
        email = nil
        pendingSessionToken = nil
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
