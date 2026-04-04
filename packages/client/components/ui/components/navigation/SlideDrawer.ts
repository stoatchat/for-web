import { createSignal } from "solid-js";

const ANIM_MS = 150,
  VEL_MS = 33, //30Hz velocity update
  VEL_AVG = 5, //Moving avg smoothing
  VEL_TRIG = 0.3, //Override drawer pos if over
  TRIG_X = 10,
  CANCEL_Y = 20;

type TrackTouch = {
  id: number;
  x: number;
  y: number;
  newX?: number;
  newT?: number;
  prevX?: number;
  prevT?: number;
  trig?: boolean;
  vAvg?: Array<number>;
  vOfs?: number;
};

export enum SlideState {
  HIDDEN = 1,
  SHOWN,
  HIDING,
  SHOWING,
  MOVING,
}

export class SlideDrawer {
  private media;
  private touch: TrackTouch | null = null;
  private tTmr: NodeJS.Timeout | null = null;
  private vTmr: NodeJS.Timeout | null = null;
  private ofs = 0;

  private eGet;
  private eSet;
  private sGet;
  private sSet;

  constructor(
    private drawer: HTMLElement,
    private root: HTMLElement,
  ) {
    this.start = this.start.bind(this);
    this.move = this.move.bind(this);
    root.addEventListener("touchstart", this.start);
    root.addEventListener("touchmove", this.move);
    root.addEventListener("touchend", this.move);

    //Signals
    const [eg, es] = createSignal(false);
    this.eGet = eg;
    this.eSet = es;
    const [sg, ss] = createSignal(SlideState.HIDDEN);
    this.sGet = sg;
    this.sSet = ss;

    //Auto-enable based on device width
    const pwMax = getComputedStyle(document.body).getPropertyValue(
      "--phone-max-width",
    );
    this.media = matchMedia(`(max-width: ${pwMax})`);
    this.media.onchange = (e) => (this.enabled = e.matches);
    this.enabled = this.media.matches;
  }

  private start(e: TouchEvent) {
    //Cancel if more than one finger
    if (e.touches.length > 1) return this.endTouch();
    if (this.touch || !this.eGet()) return;

    //Track this touch
    const t = e.touches[0];
    this.touch = {
      id: t.identifier,
      x: t.screenX,
      y: t.screenY,
    };
  }

  private move(e: TouchEvent) {
    if (!this.touch) return;
    const isEnd = e.type === "touchend";
    let t, tNew;
    for (t of e.changedTouches)
      if (t.identifier === this.touch.id) {
        tNew = t;
        break;
      }
    if (!tNew) return;

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
      }

      dx = Math.max(Math.min(this.ofs + dx, 0), max);
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

  private tfTimer(set = false, show = false) {
    //Animate transition
    const ds = this.drawer.style;
    this.setElState(false);
    if (set) {
      this.ofs = show ? -innerWidth : 0;
      ds.transition = `transform ${ANIM_MS}ms`;
      ds.transform = `translateX(${this.ofs}px)`;
      this.sSet(show ? SlideState.SHOWING : SlideState.HIDING);
    } else {
      ds.transition = ds.transform = "";
    }

    //Finalize after delay
    clearTimeout(this.tTmr!);
    this.tTmr = set
      ? setTimeout(() => {
          ds.transition = ds.transform = "";
          this.setElState(show);
          this.tTmr = null;
          this.sSet(show ? SlideState.SHOWN : SlideState.HIDDEN);
        }, ANIM_MS + 50)
      : null;
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
    this.media.onchange = null;
  }

  get enabled() {
    return this.eGet();
  }
  set enabled(en: boolean) {
    if (this.eGet() !== en) {
      this.drawer.style.zIndex = en ? "1" : "";
      this.tfTimer();
      this.endTouch();
      if (!en) this.setElState(true);
      this.ofs = 0;
      this.eSet(en);
      this.sSet(SlideState.HIDDEN);
    }
  }

  get state() {
    return this.sGet();
  }

  setShown(show: boolean) {
    if (!this.eGet() || this.touch?.trig || this.tTmr) return false;
    if ((this.ofs !== 0) !== show) {
      this.setElState(false);
      this.drawer.style.transform = `translateX(${this.ofs}px)`;
      setTimeout(() => this.tfTimer(true, show), 1);
    }
    return true;
  }
}
