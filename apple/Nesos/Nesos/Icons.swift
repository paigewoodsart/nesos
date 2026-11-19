import SwiftUI

/// The line icons from the designs, drawn on the same 24 x 24 grid.
enum NIcon {
    case plus, close, person, back, forward, pencil, check, archive, search, restore, play, stop, chevronUp, chevronDown

    fileprivate var lineWidth: CGFloat {
        switch self {
        case .plus, .close, .chevronUp, .chevronDown: 2.2
        case .person, .archive: 1.6
        case .back, .pencil, .search: 1.8
        case .forward, .restore: 2
        case .check: 3
        case .play, .stop: 0
        }
    }

    fileprivate var filled: Bool { self == .play || self == .stop }

    fileprivate func path(in rect: CGRect) -> Path {
        let s = min(rect.width, rect.height) / 24
        func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: rect.minX + x * s, y: rect.minY + y * s) }
        var path = Path()
        switch self {
        case .plus:
            path.move(to: p(12, 5)); path.addLine(to: p(12, 19))
            path.move(to: p(5, 12)); path.addLine(to: p(19, 12))
        case .close:
            path.move(to: p(6, 6)); path.addLine(to: p(18, 18))
            path.move(to: p(18, 6)); path.addLine(to: p(6, 18))
        case .person:
            path.addEllipse(in: CGRect(origin: p(8, 4), size: CGSize(width: 8 * s, height: 8 * s)))
            path.move(to: p(4, 20))
            path.addCurve(to: p(12, 14), control1: p(5.5, 16), control2: p(8.5, 14))
            path.addCurve(to: p(20, 20), control1: p(15.5, 14), control2: p(18.5, 16))
        case .back:
            path.move(to: p(15, 5)); path.addLine(to: p(8, 12)); path.addLine(to: p(15, 19))
        case .forward:
            path.move(to: p(9, 6)); path.addLine(to: p(15, 12)); path.addLine(to: p(9, 18))
        case .chevronUp:
            path.move(to: p(6, 15)); path.addLine(to: p(12, 9)); path.addLine(to: p(18, 15))
        case .chevronDown:
            path.move(to: p(6, 9)); path.addLine(to: p(12, 15)); path.addLine(to: p(18, 9))
        case .pencil:
            path.move(to: p(4, 20)); path.addLine(to: p(8, 20)); path.addLine(to: p(19, 9))
            path.addLine(to: p(15, 5)); path.addLine(to: p(4, 16)); path.closeSubpath()
            path.move(to: p(14, 6)); path.addLine(to: p(18, 10))
        case .check:
            path.move(to: p(5, 12)); path.addLine(to: p(10, 17)); path.addLine(to: p(19, 7))
        case .archive:
            path.addRoundedRect(in: CGRect(origin: p(3, 4), size: CGSize(width: 18 * s, height: 5 * s)), cornerSize: CGSize(width: s, height: s))
            path.move(to: p(5, 9)); path.addLine(to: p(5, 19)); path.addLine(to: p(19, 19)); path.addLine(to: p(19, 9))
            path.move(to: p(10, 13)); path.addLine(to: p(14, 13))
        case .search:
            path.addEllipse(in: CGRect(origin: p(5, 5), size: CGSize(width: 12 * s, height: 12 * s)))
            path.move(to: p(20, 20)); path.addLine(to: p(16, 16))
        case .restore:
            path.move(to: p(4, 10)); path.addLine(to: p(15, 10))
            path.addArc(center: p(15, 15), radius: 5 * s, startAngle: .degrees(-90), endAngle: .degrees(90), clockwise: false)
            path.addLine(to: p(9, 20))
            path.move(to: p(8, 6)); path.addLine(to: p(4, 10)); path.addLine(to: p(8, 14))
        case .play:
            path.move(to: p(7, 4)); path.addLine(to: p(20, 12)); path.addLine(to: p(7, 20)); path.closeSubpath()
        case .stop:
            path.addRoundedRect(in: CGRect(origin: p(5, 5), size: CGSize(width: 14 * s, height: 14 * s)), cornerSize: CGSize(width: 2 * s, height: 2 * s))
        }
        return path
    }
}

/// Draws an NIcon at a given size in the current foreground color.
struct Icon: View {
    let icon: NIcon
    var size: CGFloat = 14

    init(_ icon: NIcon, size: CGFloat = 14) {
        self.icon = icon
        self.size = size
    }

    var body: some View {
        Group {
            if icon.filled {
                IconShape(icon: icon).fill(.foreground)
            } else {
                IconShape(icon: icon).stroke(.foreground, style: StrokeStyle(lineWidth: icon.lineWidth * size / 24, lineCap: .round, lineJoin: .round))
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

private struct IconShape: Shape {
    let icon: NIcon
    func path(in rect: CGRect) -> Path { icon.path(in: rect) }
}

