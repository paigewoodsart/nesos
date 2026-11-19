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
/// Colors made with `adaptive` switch when the board goes dark (a dark
/// custom background color), so text stays readable.
enum Theme {
    static let paper = Color(hex: "#F9F8F6")
    static let paperWarm = Color(hex: "#EBE5DE")
    static let line = Color(hex: "#D5D3CF")
    static let ocean = Color(hex: "#1a759f")       // sign-in blue
    static let logoN = Color(hex: "#b9c8de")
    static let sky = Color(hex: "#8fb0ec")         // date tile, profile tile
    static let fixedInkSoft = Color(hex: "#4a4744") // labels that sit on light swatches

    static let ink = Color.adaptive("#1A1A1A", dark: "#FFFFFF")
    static let inkSoft = Color.adaptive("#4a4744", dark: "#FFFFFF", 0.86)   // section labels
    static let inkLight = Color.adaptive("#6C6863", dark: "#FFFFFF", 0.68)  // secondary text
    static let accent = Color.adaptive("#184e77", dark: "#cfe0f2")          // yale blue
    static let onAccent = Color.adaptive("#FFFFFF", dark: "#184e77")
    static let danger = Color.adaptive("#a0503f", dark: "#f3b0a2")

    /// Frosted surfaces.
    static let card = Color.adaptive("#FFFFFF", 0.6, dark: "#FFFFFF", 0.13)
    static let cardBorder = Color.adaptive("#FFFFFF", 0.85, dark: "#FFFFFF", 0.22)
    static let glass = Color.adaptive("#FFFFFF", 0.55, dark: "#FFFFFF", 0.14)
    static let glassBorder = Color.adaptive("#FFFFFF", 0.8, dark: "#FFFFFF", 0.24)
    static let frost = Color.adaptive("#FFFFFF", 0.2, dark: "#FFFFFF", 0.06)
    static let editCard = Color.adaptive("#FFFFFF", 0.76, dark: "#000000", 0.38)
    static let chip = Color.adaptive("#FFFFFF", 0.7, dark: "#FFFFFF", 0.12)
    static let sheet = Color.adaptive("#F9F8F6", dark: "#1c1c1e")
    static let scrollThumb = Color.adaptive("#184e77", 0.45, dark: "#FFFFFF", 0.6)
    static let scrollTrack = Color.adaptive("#FFFFFF", 0.45, dark: "#FFFFFF", 0.16)

    /// Project colors offered when adding or editing a project.
    static let projectColors: [String] = [
        "#d9ed92", "#99d98c", "#52b69a", "#34a0a4", "#168aad", "#1e6091",
        "#cf806e", "#d9a05b", "#959c52", "#8d78a8", "#e8a5b8", "#6a95a8",
    ]
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

    func lighter(_ amount: Double) -> RGB {
        RGB(r: r + (1 - r) * amount, g: g + (1 - g) * amount, b: b + (1 - b) * amount)
    }

    var color: Color { Color(red: r, green: g, blue: b) }

    /// Hue in degrees (0 to 360), saturation and lightness from 0 to 1.
    var hsl: (h: Double, s: Double, l: Double) {
        let hi = max(r, g, b), lo = min(r, g, b)
        let l = (hi + lo) / 2
        let d = hi - lo
        guard d > 0.0001 else { return (0, 0, l) }
        let s = d / (1 - abs(2 * l - 1))
        var h: Double
        if hi == r {
            h = 60 * ((g - b) / d).truncatingRemainder(dividingBy: 6)
        } else if hi == g {
            h = 60 * ((b - r) / d + 2)
        } else {
            h = 60 * ((r - g) / d + 4)
        }
        if h < 0 { h += 360 }
        return (h, min(1, s), l)
    }

    init(h: Double, s: Double, l: Double) {
        let s = min(1, max(0, s))
        let l = min(1, max(0, l))
        var hue = h.truncatingRemainder(dividingBy: 360)
        if hue < 0 { hue += 360 }
        let c = (1 - abs(2 * l - 1)) * s
        let hp = hue / 60
        let x = c * (1 - abs(hp.truncatingRemainder(dividingBy: 2) - 1))
        let m = l - c / 2
        let rgb: (Double, Double, Double)
        if hp < 1 {
            rgb = (c, x, 0)
        } else if hp < 2 {
            rgb = (x, c, 0)
        } else if hp < 3 {
            rgb = (0, c, x)
        } else if hp < 4 {
            rgb = (0, x, c)
        } else if hp < 5 {
            rgb = (x, 0, c)
        } else {
            rgb = (c, 0, x)
        }
        self.init(r: rgb.0 + m, g: rgb.1 + m, b: rgb.2 + m)
    }
}

/// The person's own color, and the shades made from it: the Overdue, Today
/// and This Week tiles, the date tile, the profile tile and the quote bar.
struct Palette {
    static let defaultHex = "#8fb0ec"
    /// Presets offered in the profile.
    static let presets = ["#8fb0ec", "#b89ee5", "#e798b2", "#e79e88", "#8bc69e", "#6ec1c4"]

    let baseHex: String
    private let overdueHex: String
    private let todayHex: String
    private let weekHex: String

    init(_ hex: String) {
        baseHex = hex
        if hex.lowercased() == Self.defaultHex {
            // The original design's exact colors.
            overdueHex = "#7f9fd6"
            todayHex = "#6fb0c8"
            weekHex = "#6a95a8"
        } else {
            // The same steps the original three tiles take from the date
            // tile's blue: a little deeper, then shifted and softer, then muted.
            let (h, s, l) = RGB(hex: hex).hsl
            overdueHex = RGB(h: h - 1, s: s * 0.72, l: max(0.3, l - 0.07)).hex
            todayHex = RGB(h: h - 23, s: s * 0.63, l: max(0.27, l - 0.13)).hex
            weekHex = RGB(h: h - 21, s: s > 0.05 ? max(0.18, s * 0.37) : s, l: max(0.24, l - 0.20)).hex
        }
    }

    var base: Color { Color(hex: baseHex) }
    var onBase: Color { Self.textColor(on: baseHex) }

    func hex(_ section: DueSection) -> String {
        switch section {
        case .overdue: overdueHex
        case .today: todayHex
        case .week: weekHex
        }
    }

    func color(_ section: DueSection) -> Color { Color(hex: hex(section)) }
    func text(_ section: DueSection) -> Color { Self.textColor(on: hex(section)) }

    /// White, or a deep shade of the color when the tile is very light.
    static func textColor(on hex: String) -> Color {
        let rgb = RGB(hex: hex)
        return rgb.luminance > 0.8 ? rgb.darker(0.68).color : .white
    }
}

extension Color {
    init(hex: String) {
        let rgb = RGB(hex: hex)
        self.init(red: rgb.r, green: rgb.g, blue: rgb.b)
    }

    /// One color in light mode, another when the board is dark.
    static func adaptive(_ light: RGB, _ lightAlpha: Double = 1, dark: RGB, _ darkAlpha: Double = 1) -> Color {
        let (lr, lg, lb) = (light.r, light.g, light.b)
        #if canImport(UIKit)
        let (dr, dg, db) = (dark.r, dark.g, dark.b)
        return Color(uiColor: UIColor(dynamicProvider: { @Sendable traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: dr, green: dg, blue: db, alpha: darkAlpha)
                : UIColor(red: lr, green: lg, blue: lb, alpha: lightAlpha)
        }))
        #else
        // The Mac app never shows the dark board.
        return Color(red: lr, green: lg, blue: lb).opacity(lightAlpha)
        #endif
    }

    static func adaptive(_ light: String, _ lightAlpha: Double = 1, dark: String, _ darkAlpha: Double = 1) -> Color {
        adaptive(RGB(hex: light), lightAlpha, dark: RGB(hex: dark), darkAlpha)
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

    private var isLight: Bool { rgb.luminance > 0.68 }

    var fill: Color { rgb.color }
    /// Text on the tile: white, or a deep shade of the color on light tiles.
    var onFill: Color { isLight ? rgb.darker(0.68).color : .white }
    /// A deep shade, for text on white (the STOP button).
    var deep: Color { rgb.darker(isLight ? 0.6 : 0.42).color }
    /// ADD and CLOSE buttons next to the tile.
    var strong: Color { Color.adaptive(rgb.darker(isLight ? 0.45 : 0.27), dark: rgb.lighter(0.4)) }
    /// Small labels inside cards (NEW TASK, DUE, NOTES).
    var label: Color { Color.adaptive(rgb.darker(isLight ? 0.6 : 0.42), dark: rgb.lighter(0.55)) }
    /// The project's name under a task.
    var text: Color { Color.adaptive(rgb, dark: rgb.lighter(0.5)) }
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
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        ZStack {
            base
            Canvas { context, size in
                var path = Path()
                var x: CGFloat = 0
                while x <= size.width { path.addRect(CGRect(x: x, y: 0, width: 1, height: size.height)); x += 28 }
                var y: CGFloat = 0
                while y <= size.height { path.addRect(CGRect(x: 0, y: y, width: size.width, height: 1)); y += 28 }
                let line = scheme == .dark
                    ? Color.white.opacity(0.06)
                    : Color(red: 26 / 255, green: 26 / 255, blue: 26 / 255).opacity(0.05)
                context.fill(path, with: .color(line))
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
