import Foundation
import Observation

enum AppSheet: String, Identifiable {
    case task, note, project, settings
    var id: String { rawValue }
}

/// Opens the quick-add sheets from anywhere: buttons, the Mac menu bar,
/// and keyboard shortcuts.
@Observable
final class QuickAddRouter {
    var sheet: AppSheet?
    /// Bumped after a save so the Mac/iPad planner window refreshes.
    private(set) var reloadCount = 0

    func didSave() { reloadCount += 1 }
}
