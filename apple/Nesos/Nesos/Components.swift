import SwiftUI
import Combine
#if canImport(UIKit)
import UIKit
#endif

// Shared pieces of the phone designs.

/// Her tapered N, traced from the website's logo file (public/nesos-icon.webp).
struct NMark: Shape {
    func path(in rect: CGRect) -> Path {
        // Points on a 780 x 962 box.
        let points: [(CGFloat, CGFloat)] = [
            (46, 18), (13, 923), (105, 923), (78, 180), (712, 943),
            (732, 943), (766, 38), (674, 38), (700, 786), (67, 18),
        ]
        let scale = min(rect.width / 780, rect.height / 962)
        let dx = rect.minX + (rect.width - 780 * scale) / 2
        let dy = rect.minY + (rect.height - 962 * scale) / 2
        var path = Path()
        for (i, point) in points.enumerated() {
            let p = CGPoint(x: dx + point.0 * scale, y: dy + point.1 * scale)
            if i == 0 { path.move(to: p) } else { path.addLine(to: p) }
        }
        path.closeSubpath()
        return path
    }
}

/// The logo in the app: the N alone, or the name spelled out (profile page).
/// One ink: the N matches the word, blue on light boards, pale on dark ones.
struct Wordmark: View {
    var showsName = false

    var body: some View {
        Group {
            if showsName {
                // Aboreto is the typeface her N comes from.
                Text("NESOS")
                    .font(NFont.aboreto(24))
                    .tracking(24 * -0.04)
                    .foregroundStyle(Theme.accent)
            } else {
                NMark()
                    .fill(Theme.accent)
                    .frame(width: 18, height: 22)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Nesos")
    }
}

/// The 44pt frosted circle buttons (back, account).
struct CircleIconButton: View {
    let icon: NIcon
    let label: String
    /// How big the circle looks. The tappable area stays 44pt.
    var size: CGFloat = 44
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Icon(icon, size: size * 20 / 44)
                .foregroundStyle(Theme.inkLight)
                .frame(width: size, height: size)
                .background(Theme.glass, in: Circle())
                .overlay(Circle().stroke(Theme.glassBorder, lineWidth: 1))
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

/// Top of every phone screen. Home: wordmark left. Inner screens: back,
/// wordmark in the middle, account.
struct HeaderBar: View {
    var onBack: (() -> Void)?
    var onAccount: (() -> Void)?
    /// The profile page spells the name out. Home shows the N. Other pages show neither.
    var showsName = false

    var body: some View {
        HStack {
            if let onBack {
                // Inner pages carry no logo. Only the profile spells the name out.
                CircleIconButton(icon: .back, label: "Back", action: onBack)
                Spacer()
                if showsName {
                    Wordmark(showsName: true)
                    Spacer()
                }
            } else {
                // Home: the N alone, upper left.
                Wordmark()
                Spacer()
            }
            if let onAccount {
                CircleIconButton(icon: .person, label: "Account", action: onAccount)
            } else {
                Color.clear.frame(width: 44, height: 44)
            }
        }
        .padding(.bottom, 18)
    }
}

/// "PROJECTS ... ADD +" and "TASKS ... ADD +" rows.
struct SectionHeader: View {
    let title: String
    var isOpen = false
    var addColor: Color = Theme.accent
    var titleColor: Color = Theme.inkSoft
    let onToggle: () -> Void

    var body: some View {
        HStack {
            Text(title).caps(11, spacing: 0.24).foregroundStyle(titleColor)
            Spacer()
            Button(action: onToggle) {
                HStack(spacing: 6) {
                    Text(isOpen ? "CLOSE" : "ADD").caps(11, spacing: 0.24)
                    Icon(isOpen ? .close : .plus, size: 13)
                }
                .foregroundStyle(isOpen ? Theme.inkLight : addColor)
                .frame(height: 28)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .padding(.trailing, 13)
    }
}

/// The see-through band along the bottom of a tile.
struct TileBar<Content: View>: View {
    var height: CGFloat = 24
    var leading: CGFloat = 12
    var trailing: CGFloat = 8
    @ViewBuilder var content: Content

    var body: some View {
        HStack(spacing: 8) { content }
            .padding(.leading, leading)
            .padding(.trailing, trailing)
            .frame(height: height)
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.22))
    }
}

/// White frosted card with the thin white border. On a dark board it
/// becomes a faint glass panel instead.
struct CardBackground: ViewModifier {
    var opacity: Double = 0.6
    var borderOpacity: Double = 0.85
    @Environment(\.colorScheme) private var scheme

    func body(content: Content) -> some View {
        let dark = scheme == .dark
        content
            .background(Color.white.opacity(dark ? opacity * 0.22 : opacity), in: RoundedRectangle(cornerRadius: 7))
            .overlay(
                RoundedRectangle(cornerRadius: 7)
                    .stroke(Color.white.opacity(dark ? borderOpacity * 0.26 : borderOpacity), lineWidth: 1)
            )
    }
}

extension View {
    func card(_ opacity: Double = 0.6, borderOpacity: Double = 0.85) -> some View {
        modifier(CardBackground(opacity: opacity, borderOpacity: borderOpacity))
    }

    /// Frosted glass, for floating buttons.
    func frosted(radius: CGFloat = 7) -> some View {
        background(Theme.frost, in: RoundedRectangle(cornerRadius: radius))
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).stroke(Theme.cardBorder, lineWidth: 1))
            .shadow(color: Color(hex: "#184e77").opacity(0.08), radius: 7, y: 4)
    }

    /// The soft fade at the bottom of scrolling lists.
    func scrollFade() -> some View {
        mask(
            LinearGradient(stops: [
                .init(color: .black, location: 0),
                .init(color: .black, location: 0.9),
                .init(color: .black.opacity(0.35), location: 1),
            ], startPoint: .top, endPoint: .bottom)
        )
    }
}

/// A vertical scroll area with the always-visible thin scroll bar from the
/// designs (5pt wide, 8pt gap from the content).
struct BarScroll<Content: View>: View {
    var thumb: Color = Theme.scrollThumb
    var gap: CGFloat = 8
    /// Shrink to the content's height (up to the space available).
    var hugs = false
    let content: Content

    init(thumb: Color = Theme.scrollThumb, gap: CGFloat = 8, hugs: Bool = false, @ViewBuilder content: () -> Content) {
        self.thumb = thumb
        self.gap = gap
        self.hugs = hugs
        self.content = content()
    }

    @State private var offset: CGFloat = 0
    @State private var contentHeight: CGFloat = 0
    @State private var viewHeight: CGFloat = 0

    var body: some View {
        ScrollView {
            content
                .padding(.trailing, gap + 5)
                .onGeometryChange(for: CGRect.self) { proxy in
                    proxy.frame(in: .named("bar-scroll"))
                } action: { frame in
                    offset = -frame.minY
                    contentHeight = frame.height
                }
        }
        .coordinateSpace(.named("bar-scroll"))
        .scrollIndicators(.hidden)
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { viewHeight = $0 }
        .overlay(alignment: .topTrailing) { bar }
        .frame(maxHeight: hugs && contentHeight > 0 ? contentHeight : .infinity)
    }

    @ViewBuilder private var bar: some View {
        if contentHeight > viewHeight + 1, viewHeight > 0 {
            let thumbHeight = max(28, viewHeight * viewHeight / contentHeight)
            let progress = min(1, max(0, offset / (contentHeight - viewHeight)))
            ZStack(alignment: .top) {
                Capsule().fill(Theme.scrollTrack)
                Capsule().fill(thumb)
                    .frame(height: thumbHeight)
                    .offset(y: progress * (viewHeight - thumbHeight))
            }
            .frame(width: 5, height: viewHeight)
            .allowsHitTesting(false)
        }
    }
}

/// Date chip on task rows ("Nov 4").
struct DueChip: View {
    let text: String?
    let tint: Tint
    var faded = false

    var body: some View {
        Group {
            if let text {
                Text(text)
                    .font(NFont.playfair(10))
                    .foregroundStyle(.white)
                    .frame(width: 42)
                    .padding(.vertical, 2)
                    .background(faded ? tint.opacity(0.45) : tint.fill, in: RoundedRectangle(cornerRadius: 4))
            } else {
                Color.clear.frame(width: 42, height: 1)
            }
        }
    }
}

/// The round check on task rows.
struct CheckCircle: View {
    let done: Bool
    let tint: Tint

    var body: some View {
        ZStack {
            if done {
                Circle().fill(tint.fill)
                Icon(.check, size: 11).foregroundStyle(.white)
            } else {
                Circle().strokeBorder(Theme.ink.opacity(0.28), lineWidth: 1.5)
            }
        }
        .frame(width: 20, height: 20)
    }
}

/// One task row. `projectName` shows the project under the text (Due screen).
struct TaskRow: View {
    let task: ProjectTask
    let tint: Tint
    var projectName: String?
    var height: CGFloat = 44
    var openOpacity: Double = 0.6
    let onToggle: () -> Void
    let onTap: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            DueChip(text: DueDate.label(task.dueDate), tint: tint, faded: task.done)
            VStack(alignment: .leading, spacing: 2) {
                Text(task.text)
                    .font(NFont.inter(13))
                    .strikethrough(task.done)
                    .foregroundStyle(task.done ? Theme.inkLight : Theme.ink)
                    .lineLimit(1)
                if let projectName {
                    Text(projectName).caps(9).foregroundStyle(tint.text).lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Button(action: onToggle) {
                CheckCircle(done: task.done, tint: tint)
                    .frame(width: 36, height: 36)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.trailing, -8)
            .accessibilityLabel(task.done ? "Mark not done" : "Mark done")
        }
        .padding(.horizontal, 12)
        .frame(height: height)
        .card(task.done ? 0.35 : openOpacity, borderOpacity: task.done && projectName == nil ? 0.6 : 0.85)
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
    }
}

/// Quote of the day + date tile.
struct QuoteDateRow: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        let quote = Quotes.today
        let palette = store.palette
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 6) {
                Text(quote.quote)
                    .font(NFont.inter(11))
                    .lineSpacing(11 * 0.4 - 2)
                    .foregroundStyle(Theme.ink)
                    .minimumScaleFactor(0.8)
                Text(quote.byline)
                    .font(NFont.inter(10))
                    .foregroundStyle(Theme.inkLight)
            }
            .padding(.leading, 10)
            .overlay(alignment: .leading) { Rectangle().fill(palette.base).frame(width: 2) }
            .padding(12)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .card()

            TimelineView(.everyMinute) { context in
                VStack(alignment: .leading, spacing: 0) {
                    Text(Self.format(context.date, "MMMM")).caps(10)
                        .padding([.top, .horizontal], 12)
                    Spacer(minLength: 0)
                    Text(Self.format(context.date, "d"))
                        .font(NFont.playfair(34))
                        .padding(.horizontal, 12)
                    Spacer(minLength: 0)
                    TileBar {
                        Text(Self.format(context.date, "EEEE")).caps(10)
                        Spacer()
                    }
                }
                .foregroundStyle(palette.onBase)
                .frame(width: 136)
                .frame(maxHeight: .infinity)
                .background(palette.base)
                .clipShape(RoundedRectangle(cornerRadius: 7))
            }
        }
        .frame(height: 108)
        .padding(.trailing, 13)
    }

    private static func format(_ date: Date, _ pattern: String) -> String {
        let f = DateFormatter()
        f.dateFormat = pattern
        return f.string(from: date)
    }
}

/// A short error line shown at the bottom of a screen.
struct ErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        Button(action: onDismiss) {
            Text(message)
                .font(NFont.inter(12))
                .foregroundStyle(Theme.danger)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .frosted()
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 20)
    }
}

#if os(iOS)
extension View {
    /// Tracks whether the keyboard is up, so screens can make room for it.
    func trackKeyboard(_ visible: Binding<Bool>) -> some View {
        onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in
            withAnimation(.easeOut(duration: 0.2)) { visible.wrappedValue = true }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in
            withAnimation(.easeOut(duration: 0.2)) { visible.wrappedValue = false }
        }
    }
}
#endif
