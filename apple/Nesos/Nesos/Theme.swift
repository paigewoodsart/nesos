import Foundation
import SwiftUI
import CoreText
#if canImport(UIKit)
import UIKit
#endif
#if os(macOS)
import AppKit
#endif

/// Colors from the Nesos designs (app/globals.css and the phone storyboard).
enum Theme {
    static let paper = Color(hex: "#F9F8F6")
    static let paperWarm = Color(hex: "#EBE5DE")
    static let line = Color(hex: "#D5D3CF")
    static let ink = Color(hex: "#1A1A1A")
    static let inkSoft = Color(hex: "#4a4744")     // section labels
    static let inkLight = Color(hex: "#6C6863")    // secondary text
    static let accent = Color(hex: "#184e77")      // yale blue
    static let ocean = Color(hex: "#1a759f")       // sign-in blue
    static let logoN = Color(hex: "#b9c8de")
    static let sky = Color(hex: "#8fb0ec")         // date tile, profile tile
    static let danger = Color(hex: "#a0503f")

    /// Frosted card surfaces.
    static let card = Color.white.opacity(0.6)
    static let cardBorder = Color.white.opacity(0.85)

    /// Project colors offered when adding or editing a project.
    static let projectColors: [String] = [
        "#d9ed92", "#99d98c", "#52b69a", "#34a0a4", "#168aad", "#1e6091",
        "#cf806e", "#d9a05b", "#959c52", "#8d78a8", "#e8a5b8", "#6a95a8",
    ]

    /// Old sign-in gradient (kept for the Mac quick-add sheets).
    static let islandGradient = LinearGradient(
        colors: [Color(hex: "#dfe8ff"), Color(hex: "#d4f5f5"), Color(hex: "#d8fae5"), Color(hex: "#fffbd4")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Hex colors

struct RGB: Equatable {
    var r: Double, g: Double, b: Double

    init(r: Double, g: Double, b: Double) { self.r = r; self.g = g; self.b = b }

    init(hex: String) {
        var value: UInt64 = 0
        Scanner(string: hex.replacingOccurrences(of: "#", with: "")).scanHexInt64(&value)
        r = Double((value >> 16) & 0xFF) / 255
        g = Double((value >> 8) & 0xFF) / 255
        b = Double(value & 0xFF) / 255
    }

    var hex: String {
        String(format: "#%02x%02x%02x", Int((r * 255).rounded()), Int((g * 255).rounded()), Int((b * 255).rounded()))
    }

    /// Perceived brightness, 0 to 1.
    var luminance: Double { 0.299 * r + 0.587 * g + 0.114 * b }

    func darker(_ amount: Double) -> RGB { RGB(r: r * (1 - amount), g: g * (1 - amount), b: b * (1 - amount)) }

    var color: Color { Color(red: r, green: g, blue: b) }
}

extension Color {
    init(hex: String) {
        let rgb = RGB(hex: hex)
        self.init(red: rgb.r, green: rgb.g, blue: rgb.b)
    }

    /// "#rrggbb" for a color picked in a ColorPicker.
    var hexString: String {
        #if canImport(UIKit)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(self).getRed(&r, green: &g, blue: &b, alpha: &a)
        return RGB(r: Double(r), g: Double(g), b: Double(b)).hex
        #else
        let c = NSColor(self).usingColorSpace(.sRGB) ?? .white
        return RGB(r: Double(c.redComponent), g: Double(c.greenComponent), b: Double(c.blueComponent)).hex
        #endif
    }
}

/// The colors one project tile needs, worked out from its hex color.
struct Tint {
    let hex: String
    private let rgb: RGB

    init(_ hex: String) {
        self.hex = hex
        rgb = RGB(hex: hex)
    }

    var fill: Color { rgb.color }
    /// Text on the tile: white, or a deep shade of the color on light tiles.
    var onFill: Color { rgb.luminance > 0.68 ? rgb.darker(0.68).color : .white }
    /// ADD and CLOSE buttons next to the tile.
    var strong: Color { rgb.darker(rgb.luminance > 0.68 ? 0.45 : 0.27).color }
    /// Small labels inside cards (NEW TASK, DUE, NOTES).
    var label: Color { rgb.darker(rgb.luminance > 0.68 ? 0.6 : 0.42).color }
    func opacity(_ value: Double) -> Color { rgb.color.opacity(value) }
}

// MARK: - Fonts

/// Her fonts: Playfair Display, Inter and Aboreto, bundled in Fonts/.
enum NFont {
    static func register() {
        var urls: [URL] = []
        for sub in [nil, "Fonts"] as [String?] {
            for ext in ["ttf", "otf"] {
                urls += Bundle.main.urls(forResourcesWithExtension: ext, subdirectory: sub) ?? []
            }
        }
        for url in Set(urls) {
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }

    /// Inter is one variable font file, so the weight is set on its axis.
    static func inter(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let value: CGFloat
        switch weight {
        case .light: value = 300
        case .medium: value = 500
        case .semibold: value = 600
        case .bold: value = 700
        default: value = 400
        }
        let attributes: [CFString: Any] = [
            kCTFontFamilyNameAttribute: "Inter",
            kCTFontVariationAttribute: [2003265652: value], // 'wght'
        ]
        let descriptor = CTFontDescriptorCreateWithAttributes(attributes as CFDictionary)
        return Font(CTFontCreateWithFontDescriptor(descriptor, size, nil))
    }

    static func playfair(_ size: CGFloat) -> Font { .custom("Playfair Display", size: size) }
    static func playfairItalic(_ size: CGFloat) -> Font { .custom("PlayfairDisplay-Italic", size: size) }
    static func aboreto(_ size: CGFloat) -> Font { .custom("Aboreto", size: size) }
}

extension View {
    /// Spaced capitals in Inter, the label style used across the designs.
    func caps(_ size: CGFloat, spacing: CGFloat = 0.2, weight: Font.Weight = .semibold) -> some View {
        font(NFont.inter(size, weight)).tracking(size * spacing).textCase(.uppercase)
    }
}

// MARK: - Background

/// The board background: the theme's gradient (or custom color) with the
/// faint 28pt grid from the website.
struct BoardBackground: View {
    let theme: String
    let customColor: String

    var body: some View {
        ZStack {
            base
            Canvas { context, size in
                var path = Path()
                var x: CGFloat = 0
                while x <= size.width { path.addRect(CGRect(x: x, y: 0, width: 1, height: size.height)); x += 28 }
                var y: CGFloat = 0
                while y <= size.height { path.addRect(CGRect(x: 0, y: y, width: size.width, height: 1)); y += 28 }
                context.fill(path, with: .color(Color(red: 26 / 255, green: 26 / 255, blue: 26 / 255).opacity(0.05)))
            }
        }
        .ignoresSafeArea()
    }

    @ViewBuilder private var base: some View {
        switch theme {
        case "neutral":
            LinearGradient(stops: [
                .init(color: Color(hex: "#FAF7F2"), location: 0),
                .init(color: Color(hex: "#F5EDE0"), location: 0.5),
                .init(color: Color(hex: "#EDE3D4"), location: 1),
            ], startPoint: UnitPoint(x: 0.32, y: 0), endPoint: UnitPoint(x: 0.68, y: 1))
        case "custom":
            Color(hex: customColor)
        default:
            Self.pastel
        }
    }

    static let pastel = LinearGradient(stops: [
        .init(color: Color(hex: "#fce4ff"), location: 0),
        .init(color: Color(hex: "#dfe8ff"), location: 0.32),
        .init(color: Color(hex: "#d4f5f5"), location: 0.58),
        .init(color: Color(hex: "#d8fae5"), location: 0.80),
        .init(color: Color(hex: "#fffbd4"), location: 1),
    ], startPoint: UnitPoint(x: 0.32, y: 0), endPoint: UnitPoint(x: 0.68, y: 1))
}
