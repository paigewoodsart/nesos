import Foundation

enum Config {
    /// The live Nesos site. The app talks to the same API routes the website uses.
    /// www is used because the live site serves its assets from www.nesos.co.
    /// API.swift keeps the sign-in header if the site redirects between hosts.
    static let baseURL = URL(string: "https://www.nesos.co")!
    /// Cookie domain that covers both nesos.co and www.nesos.co.
    static let cookieDomain = ".nesos.co"
    /// Custom URL scheme the sign-in flow returns to (nesos://auth-callback).
    static let callbackScheme = "nesos"
    static let privacyURL = URL(string: "https://www.nesos.co/privacy")!
}
