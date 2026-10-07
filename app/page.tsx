import Link from "next/link";
import styles from "./home.module.css";
export default function Home() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          fg<span>FocusGuard</span>
        </Link>
        <Link href="/extension">Open companion ↗</Link>
      </nav>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>A BROWSER EXTENSION FOR FOCUSED WORK</p>
          <h1>
            A little less
            <br />
            tab switching.
          </h1>
          <p className={styles.lead}>
            Set aside time for one task. FocusGuard puts a reminder between you
            and the sites that usually pull you away.
          </p>
          <div className={styles.actions}>
            <a href="/focusguard-extension.zip" download>
              Download extension ↓
            </a>
            <Link href="/extension">Connect the companion</Link>
          </div>
          <p className={styles.note}>
            Chrome 120+ · Local storage · No account required
          </p>
        </div>
        <aside
          className={styles.preview}
          aria-label="Example focus session, illustrative only"
        >
          <div className={styles.previewTop}>
            <span>FOCUSGUARD</span>
            <span>Example session</span>
          </div>
          <p className={styles.timer}>25:00</p>
          <p>One task. A clear stopping point.</p>
          <div className={styles.rule}>
            <span>reddit.com</span>
            <strong>Block</strong>
          </div>
          <div className={styles.rule}>
            <span>youtube.com</span>
            <strong>Ask first</strong>
          </div>
          <div className={styles.rule}>
            <span>docs.google.com</span>
            <strong>Allow</strong>
          </div>
          <small>Choose your own rules in the extension.</small>
        </aside>
      </section>
      <section className={styles.features}>
        <article>
          <span>01 / SET YOUR BOUNDARIES</span>
          <h2>Different sites, different rules.</h2>
          <p>
            Block a distraction, ask before opening a video, or allow a useful
            site. Rules include subdomains and can be changed at any time.
          </p>
        </article>
        <article>
          <span>02 / LEAVE ROOM FOR A BREAK</span>
          <h2>Focus, then step away.</h2>
          <p>
            Start a session from the toolbar. Optional Pomodoro cycles pause
            reminders during breaks and bring them back for the next focus
            period.
          </p>
        </article>
        <article>
          <span>03 / SEE WHERE TIME WENT</span>
          <h2>Reports that stay with you.</h2>
          <p>
            Review approximate active browsing time and tab switches. Export
            your history or clear it. Nothing is uploaded by the extension.
          </p>
        </article>
      </section>
      <section className={styles.install} id="install">
        <div>
          <p className={styles.kicker}>GET STARTED</p>
          <h2>
            Load it once.
            <br />
            Use it from your toolbar.
          </h2>
          <p>
            This is an unpacked project build, not a Chrome Web Store listing.
          </p>
        </div>
        <ol>
          <li>
            <strong>Download and extract the ZIP.</strong>
            <span>Keep the extracted folder somewhere you won’t move it.</span>
          </li>
          <li>
            <strong>Open chrome://extensions.</strong>
            <span>
              Enable Developer mode, choose Load unpacked, and select the
              extracted folder.
            </span>
          </li>
          <li>
            <strong>Pin FocusGuard and reload your tabs.</strong>
            <span>Choose your site rules, save them, and start a session.</span>
          </li>
        </ol>
      </section>
      <section className={styles.limit}>
        <h2>A tool you stay in control of.</h2>
        <p>
          FocusGuard uses page reminders, not network-level filtering. You can
          always stop from the toolbar. It cannot control Chrome’s protected
          pages, and its activity estimates are not exact timekeeping.
        </p>
      </section>
      <footer className={styles.footer}>
        <span>FocusGuard · Browser focus companion</span>
        <Link href="/extension">Install & connection help ↗</Link>
      </footer>
    </main>
  );
}
