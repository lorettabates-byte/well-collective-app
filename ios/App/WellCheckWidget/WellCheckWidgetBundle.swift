import WidgetKit
import SwiftUI

@main
struct WellCheckWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        WellCheckHomeWidget()
        if #available(iOSApplicationExtension 16.0, *) {
            WellCheckLockWidget()
        }
    }
}
