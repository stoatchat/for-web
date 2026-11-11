import {
  Accessor,
  createEffect,
  createRoot,
  createSignal,
  Setter,
} from "solid-js";

import { useDevice } from "@revolt/common";

const ANIM_MS = 150,
  VEL_MS = 33, //30Hz velocity update
  VEL_AVG = 5, //Moving avg smoothing
  VEL_TRIG = 0.3, //Override drawer pos if over
  TRIG_X = 10,
  CANCEL_Y = 20,
  HOME_BAR = 30; //Fallback when there's no bottom safe area

type TrackTouch = {
  id: number;
  x: number;
  y: number;
  newX?: number;
  newT?: number;
  prevX?: number;
  prevT?: number;
  trig?: boolean;
  pos?: number;
  vAvg?: Array<number>;
  vOfs?: number;
};

export const enum SlideState {
  HIDDEN = 1,
  SHOWN,
  HIDING,
  SHOWING,
  MOVING,
}

let insetProbe: HTMLElement | undefined;

//env() can't be read from JS, so measure it with a hidden element
function bottomInset() {
  if (!insetProbe) {
    insetProbe = document.createElement("div");
    insetProbe.style.cssText =
      "position:fixed;visibility:hidden;pointer-events:none;height:env(safe-area-inset-bottom)";
    document.body.appendChild(insetProbe);
  }
  return insetProbe.offsetHeight;
}

export class SlideDrawer {
  private touch: TrackTouch | null = null;
  private tTmr: NodeJS.Timeout | null = null;
  private vTmr: NodeJS.Timeout | null = null;
  private lShow = true;
  private ofs = 0;
  private queued?: boolean;

  private dispose!: () => void;
  private eGet!: Accessor<boolean>;
  private eSet!: Setter<boolean>;
  private sGet!: Accessor<SlideState>;
  private sSet!: Setter<SlideState>;

  constructor(
    private drawer: HTMLElement,
    private root: HTMLElement,
  ) {
    this.start = this.start.bind(this);
    this.move = this.move.bind(this);
    this.onHide = this.onHide.bind(this);
    root.addEventListener("touchstart", this.start);
    root.addEventListener("touchmove", this.move);
    root.addEventListener("touchend", this.move);
    // iOS sends touchcancel instead of touchend when the system takes over a swipe
    root.addEventListener("touchcancel", this.move);
    //iOS can background the app mid-swipe without sending either
    document.addEventListener("visibilitychange", this.onHide);
    window.addEventListener("pagehide", this.onHide);

    createRoot((dispose) => {
      this.dispose = dispose;

      //Signals
      const [eg, es] = createSignal(false);
      this.eGet = eg;
      this.eSet = es;
      const [sg, ss] = createSignal(SlideState.HIDDEN);
      this.sGet = sg;
      this.sSet = ss;

      //Auto-enable based on layout
      const dev = useDevice();
      createEffect(() => {
        this.enabled = dev.layout() === "phone";
      });
    });
  }

  private start(e: TouchEvent) {
    //Cancel if more than one finger
    if (e.touches.length > 1) return this.cancel();
    if (!this.eGet()) return;

    //Replace a touch that ended without us hearing about it
    if (this.touch) {
      for (const cur of e.touches) if (cur.identifier === this.touch.id) return;
      this.cancel();
    }

    //Leave swipes on the home indicator to the system
    const t = e.touches[0];
    if (t.clientY > innerHeight - (bottomInset() || HOME_BAR)) return;

    //Track this touch
    this.touch = {
      id: t.identifier,
      x: t.screenX,
      y: t.screenY,
    };
  }

  private move(e: TouchEvent) {
    if (!this.touch) return;
    const isEnd = e.type === "touchend" || e.type === "touchcancel";
    let t, tNew;
    for (t of e.changedTouches)
      if (t.identifier === this.touch.id) {
        tNew = t;
        break;
      }
    if (!tNew) {
      if (e.type === "touchcancel") this.cancel();
      return;
    }

    t = this.touch;
    const dy = tNew.screenY - t.y,
      ds = this.drawer.style,
      max = -innerWidth;
    let dx = tNew.screenX - t.x,
      trig = t.trig;

    if (!trig && Math.abs(dy) > CANCEL_Y) {
      this.endTouch();
    } else if (trig || Math.abs(dx) > TRIG_X) {
      //Store new/prev X for vel calc
      const type = trig ? "new" : "prev";
      t[`${type}X`] = dx;
      t[`${type}T`] = performance.now();

      if (!trig) {
        t.trig = trig = true;
        this.tfTimer();
        this.velTimer();
        if (!isEnd) this.sSet(SlideState.MOVING);
        //Hide keyboard
        (document.activeElement as HTMLElement)?.blur();
      }

      dx = t.pos = Math.max(Math.min(this.ofs + dx, 0), max);
      if (!isEnd) ds.transform = `translateX(${dx}px)`;
      e.preventDefault();
      e.stopPropagation();
    }

    if (isEnd) {
      if (trig) {
        this.addVel();
        //Calc avg vel
        let vel = 0;
        if (t.vAvg) {
          let v;
          for (v of t.vAvg) vel += v;
          vel /= t.vAvg.length;
        }
        //Finalize show/hide state
        let show = dx < max / 2;
        if (vel > VEL_TRIG) show = false;
        else if (vel < -VEL_TRIG) show = true;
        this.tfTimer(true, show);
      }
      this.endTouch();
    }
  }

  private velTimer() {
    if (this.vTmr) return;
    this.vTmr = setInterval(this.addVel.bind(this), VEL_MS);
  }

  private addVel(skipStale = false) {
    const t = this.touch;
    if (!t || !t.newT) return;

    //Velocity since last update
    const stale = t.prevT === t.newT,
      vel = stale ? 0 : (t.newX! - t.prevX!) / (t.newT! - t.prevT!);

    if (stale && skipStale) return;

    t.prevX = t.newX;
    t.prevT = t.newT;

    if (t.vAvg) {
      //Insert at vOfs
      t.vAvg[t.vOfs!] = vel;
      if (++t.vOfs! === VEL_AVG) t.vOfs = 0;
    } else {
      //Fill with first data
      t.vAvg = [vel];
      t.vOfs = 1;
    }
  }

  private endTouch() {
    clearInterval(this.vTmr!);
    this.touch = this.vTmr = null;
  }

  //Drop the current swipe and settle on whichever side is nearer
  private cancel(animate = true) {
    const t = this.touch;
    this.endTouch();
    if (t?.trig) {
      const show = (t.pos ?? this.ofs) < -innerWidth / 2;
      if (animate) this.tfTimer(true, show);
      else this.finish(show);
    } else if (this.tTmr && !animate) {
      this.finish(this.ofs !== 0);
    }
  }

  private onHide(e: Event) {
    if (e.type === "visibilitychange" && !document.hidden) return;
    //Timers don't run in the background, so skip the animation
    this.cancel(false);
  }

  private tfTimer(set = false, show = false) {
    //Animate transition
    const ds = this.drawer.style;
    this.setElState(false);
    if (set) {
      this.ofs = show ? -innerWidth : 0;
      ds.transition = `transform ${ANIM_MS}ms ease-out`;
      ds.transform = `translateX(${this.ofs}px)`;
      this.sSet(show ? SlideState.SHOWING : SlideState.HIDING);
    } else {
      ds.transition = ds.transform = "";
      this.queued = undefined;
    }

    //Finalize after delay
    clearTimeout(this.tTmr!);
    this.tTmr = set ? setTimeout(() => this.finish(show), ANIM_MS + 50) : null;
  }

  //Snap to the resting position and run any request made during the animation
  private finish(show: boolean) {
    const ds = this.drawer.style;
    clearTimeout(this.tTmr!);
    this.tTmr = null;
    ds.transition = ds.transform = "";
    this.ofs = show ? -innerWidth : 0;
    this.setElState(show);
    this.sSet(show ? SlideState.SHOWN : SlideState.HIDDEN);

    const queued = this.queued;
    this.queued = undefined;
    if (queued !== undefined && queued !== show) this.setShown(queued);
  }

  private setElState(show: boolean) {
    const ds = this.drawer.style;
    this.root.style.width = show ? "" : "200vw";
    ds.marginLeft = show ? "" : "100vw";
  }

  delete() {
    this.enabled = false;
    this.root.removeEventListener("touchstart", this.start);
    this.root.removeEventListener("touchmove", this.move);
    this.root.removeEventListener("touchend", this.move);
    this.root.removeEventListener("touchcancel", this.move);
    document.removeEventListener("visibilitychange", this.onHide);
    window.removeEventListener("pagehide", this.onHide);
    this.dispose();
  }

  get enabled() {
    return this.eGet();
  }
  set enabled(en: boolean) {
    if (this.eGet() !== en) {
      this.drawer.style.zIndex = en ? "1" : "";
      this.tfTimer();
      this.endTouch();
      if (!en) this.lShow = this.sGet() === SlideState.SHOWN;
      //Restore show/hide state
      const show = en ? this.lShow : false;
      this.setElState(!en || show);
      this.ofs = show ? -innerWidth : 0;
      this.eSet(en);
      this.sSet(show ? SlideState.SHOWN : SlideState.HIDDEN);
    }
  }

  get state() {
    return this.sGet();
  }

  setShown(show: boolean) {
    if (!this.eGet() || this.touch?.trig) return false;
    if (this.tTmr) {
      this.queued = show;
      return true;
    }
    if (this.sGet() === (show ? SlideState.SHOWN : SlideState.HIDDEN)) {
      this.finish(show);
    } else {
      this.ofs = show ? 0 : -innerWidth;
      this.setElState(false);
      this.drawer.style.transform = `translateX(${this.ofs}px)`;
      //Commit the start position now so the slide begins straight away
      void this.drawer.offsetWidth;
      this.tfTimer(true, show);
    }
    return true;
  }
}
