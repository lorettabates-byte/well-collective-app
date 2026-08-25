import Capacitor
import Foundation
import MediaPlayer

// Bridges the web MediaSession metadata to the iOS lock screen / Control Center
// via MPNowPlayingInfoCenter. Without this, WKWebView does not forward artwork
// to the system-level now-playing UI.
@objc(NowPlayingPlugin)
public class NowPlayingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NowPlayingPlugin"
    public let jsName = "NowPlaying"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setTrack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPlaybackState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
    ]

    // Cache the last artwork URL so we don't re-fetch on every play/pause toggle
    private var cachedArtworkUrl: String?
    private var cachedArtwork: MPMediaItemArtwork?

    @objc func setTrack(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? ""
        let artist = call.getString("artist") ?? "WELL Collective"
        let artworkUrl = call.getString("artworkUrl") ?? ""
        let duration = call.getDouble("duration") ?? 0

        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPNowPlayingInfoPropertyMediaType: MPNowPlayingInfoMediaType.audio.rawValue,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: 1.0,
        ]

        if artworkUrl.isEmpty {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            call.resolve()
            return
        }

        // Reuse cached artwork if the URL hasn't changed
        if artworkUrl == cachedArtworkUrl, let cached = cachedArtwork {
            info[MPMediaItemPropertyArtwork] = cached
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            call.resolve()
            return
        }

        guard let url = URL(string: artworkUrl) else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            call.resolve()
            return
        }

        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            if let data = data, let image = UIImage(data: data) {
                let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                self?.cachedArtworkUrl = artworkUrl
                self?.cachedArtwork = artwork
                info[MPMediaItemPropertyArtwork] = artwork
            }
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        }.resume()

        call.resolve()
    }

    @objc func setPlaybackState(_ call: CAPPluginCall) {
        let isPlaying = call.getBool("isPlaying") ?? false
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        call.resolve()
    }

    @objc func clear(_ call: CAPPluginCall) {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        cachedArtworkUrl = nil
        cachedArtwork = nil
        call.resolve()
    }
}
