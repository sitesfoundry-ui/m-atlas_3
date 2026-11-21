const DURATION = 2100;

const P_HOLD = 0.14;
const P_SLIT = 0.30;
const P_CIRCLE = 0.58;
const P_BG_START = 0.45;
const P_BG_END = 0.78;
const P_NAV_START = 0.50;
const P_NAV_END = 0.86;
const P_BAR_START = 0.52;
const P_BAR_END = 0.90;
const P_RULE_START = 0.40;
const P_RULE_END = 0.95;
const P_ICONS_START = 0.80;

const EASE_SLIT = "cubic-bezier(.5,0,.3,1)";
const EASE_CIRCLE = "cubic-bezier(.45,0,.3,1)";
const EASE_OPEN = "cubic-bezier(.4,0,.2,1)";
const EASE_CHROME = "cubic-bezier(.2,.8,.2,1)";

export function createFooterReveal(root) {
  const bg = root.querySelector(".bf-bg");
  const nav = root.querySelector(".bf-nav");
  const word = root.querySelector(".bf-word");
  const pill = root.querySelector(".bf-pill");
  const clip = root.querySelector(".bf-pill-clip");
  const hair = root.querySelector(".bf-hairline");
  const icons = root.querySelector(".bf-pill-icons");
  const bottom = root.querySelector(".bf-bottom");
  const rule = root.querySelector(".bf-rule");

  let animations = [];
  let replaying = false;

  const isPhone = () => window.matchMedia("(max-width: 720px)").matches;

  function clearAnimations() {
    for (const anim of animations) {
      try {
        anim.cancel();
      } catch {
        // Ignore already finished
      }
    }
    animations = [];
  }

  function applyInitialState() {
    clearAnimations();
    root.dataset.state = "initial";
  }

  function applyFinalState() {
    clearAnimations();
    root.dataset.state = "open";
  }

  function buildTimeline(direction = 1) {
    clearAnimations();
    const phone = isPhone();
    const phoneFinalH = Math.max(120, (window.innerWidth - 40) / 1.85);

    const opts = {
      duration: DURATION,
      fill: "both",
    };

    const tracks = [];

    if (phone) {
      tracks.push([
        pill,
        [
          { offset: 0, height: "1.5px", easing: "linear" },
          { offset: P_HOLD, height: "1.5px", easing: EASE_SLIT },
          { offset: P_SLIT, height: `${(phoneFinalH * 0.1).toFixed(2)}px`, easing: EASE_CIRCLE },
          { offset: P_CIRCLE, height: `${(phoneFinalH * 0.55).toFixed(2)}px`, easing: EASE_OPEN },
          { offset: 1, height: `${phoneFinalH.toFixed(2)}px` },
        ],
      ]);
      tracks.push([
        clip,
        [
          { offset: 0, clipPath: "inset(0 50%)", easing: EASE_SLIT },
          { offset: P_HOLD, clipPath: "inset(0 0%)", easing: "linear" },
          { offset: 1, clipPath: "inset(0 0%)" },
        ],
      ]);
      tracks.push([
        word,
        [
          { offset: 0, gap: "0.03em", easing: "linear" },
          { offset: P_HOLD, gap: "0.03em", easing: EASE_CIRCLE },
          { offset: P_CIRCLE, gap: "0.06em", easing: EASE_OPEN },
          { offset: 1, gap: "0.1em" },
        ],
      ]);
    } else {
      tracks.push([
        pill,
        [
          { offset: 0, width: "0.012em", easing: "linear" },
          { offset: P_HOLD, width: "0.012em", easing: EASE_SLIT },
          { offset: P_SLIT, width: "0.16em", easing: EASE_CIRCLE },
          { offset: P_CIRCLE, width: "1.81em", easing: EASE_OPEN },
          { offset: 1, width: "3.62em" },
        ],
      ]);
      tracks.push([
        clip,
        [
          { offset: 0, clipPath: "inset(50% 0)", easing: EASE_SLIT },
          { offset: P_HOLD, clipPath: "inset(0% 0)", easing: "linear" },
          { offset: 1, clipPath: "inset(0% 0)" },
        ],
      ]);
      tracks.push([
        word,
        [
          { offset: 0, gap: "0.026em", easing: "linear" },
          { offset: P_HOLD, gap: "0.026em", easing: EASE_CIRCLE },
          { offset: P_CIRCLE, gap: "0.05em", easing: EASE_OPEN },
          { offset: 1, gap: "0.085em" },
        ],
      ]);
    }

    tracks.push([
      hair,
      [
        { offset: 0, opacity: 1, easing: "linear" },
        { offset: P_HOLD, opacity: 1, easing: "ease-out" },
        { offset: P_SLIT, opacity: 0, easing: "linear" },
        { offset: 1, opacity: 0 },
      ],
    ]);

    tracks.push([
      bg,
      [
        { offset: 0, opacity: 0, easing: "linear" },
        { offset: P_BG_START, opacity: 0, easing: "ease-out" },
        { offset: P_BG_END, opacity: 1, easing: "linear" },
        { offset: 1, opacity: 1 },
      ],
    ]);

    tracks.push([
      nav,
      [
        { offset: 0, transform: "translateY(-140%)", easing: "linear" },
        { offset: P_NAV_START, transform: "translateY(-140%)", easing: EASE_CHROME },
        { offset: P_NAV_END, transform: "translateY(0%)", easing: "linear" },
        { offset: 1, transform: "translateY(0%)" },
      ],
    ]);

    tracks.push([
      bottom,
      [
        { offset: 0, transform: "translateY(160%)", easing: "linear" },
        { offset: P_BAR_START, transform: "translateY(160%)", easing: EASE_CHROME },
        { offset: P_BAR_END, transform: "translateY(0%)", easing: "linear" },
        { offset: 1, transform: "translateY(0%)" },
      ],
    ]);

    tracks.push([
      rule,
      [
        { offset: 0, transform: "scaleX(0)", easing: "linear" },
        { offset: P_RULE_START, transform: "scaleX(0)", easing: EASE_CHROME },
        { offset: P_RULE_END, transform: "scaleX(1)", easing: "linear" },
        { offset: 1, transform: "scaleX(1)" },
      ],
    ]);

    tracks.push([
      icons,
      [
        { offset: 0, opacity: 0, easing: "linear" },
        { offset: P_ICONS_START, opacity: 0, easing: "ease-out" },
        { offset: 1, opacity: 1 },
      ],
    ]);

    root.dataset.state = "animating";
    animations = tracks
      .filter(([el]) => Boolean(el))
      .map(([el, keyframes]) => {
        const anim = el.animate(keyframes, opts);
        if (direction < 0) {
          anim.currentTime = DURATION;
          anim.playbackRate = -1;
        }
        return anim;
      });

    return Promise.all(animations.map((a) => a.finished.catch(() => {})));
  }

  return {
    reset() {
      applyInitialState();
    },

    async play() {
      await buildTimeline(1);
      applyFinalState();
    },

    async replay(onStateChange) {
      if (replaying) return;
      replaying = true;
      onStateChange?.(true);
      try {
        await buildTimeline(-1);
        await buildTimeline(1);
        applyFinalState();
      } finally {
        replaying = false;
        onStateChange?.(false);
      }
    },

    finish() {
      replaying = false;
      applyFinalState();
    },

    destroy() {
      clearAnimations();
    },
  };
}
