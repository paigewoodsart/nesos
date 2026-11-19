import Foundation
import SwiftUI

/// Colors from the Nesos web app (app/globals.css and lib/theme.ts).
enum Theme {
    static let paper = Color(hex: "#F9F8F6")      // warm alabaster background
    static let paperWarm = Color(hex: "#EBE5DE")  // secondary surfaces
    static let line = Color(hex: "#D5D3CF")       // borders
    static let ink = Color(hex: "#1A1A1A")        // primary text
    static let inkLight = Color(hex: "#6C6863")   // secondary text
    static let accent = Color(hex: "#184e77")     // yale blue
    static let sage = Color(hex: "#34a0a4")       // completed states

    /// Soft island gradient used behind the sign-in screen.
    static let islandGradient = LinearGradient(
        colors: [Color(hex: "#dfe8ff"), Color(hex: "#d4f5f5"), Color(hex: "#d8fae5"), Color(hex: "#fffbd4")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Project colors offered on the phone (a subset of the web palette).
    static let projectColors: [String] = [
        "#d9ed92", "#99d98c", "#52b69a", "#34a0a4",
        "#00b4d8", "#1a759f", "#184e77", "#264653",
    ]
}

extension Color {
    init(hex: String) {
        var value: UInt64 = 0
        Scanner(string: hex.replacingOccurrences(of: "#", with: "")).scanHexInt64(&value)
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}
