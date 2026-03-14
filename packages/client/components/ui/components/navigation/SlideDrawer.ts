const ANIM_MS = 200,
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

export class SlideDrawer {
  enabled = false;
  private media;
  private touch: TrackTouch | null = null;
  private tTmr: NodeJS.Timeout | null = null;
  private vTmr: NodeJS.Timeout | null = null;
  private ofs = 0;

  constructor(
    private drawer: HTMLElement,
    private root: HTMLElement,
    public onStateChanged: ((en: boolean) => void) | null = null,
  ) {
    console.log("INIT", drawer, root);

    this.start = this.start.bind(this);
    this.move = this.move.bind(this);
    root.addEventListener("touchstart", this.start);
    root.addEventListener("touchmove", this.move);
    root.addEventListener("touchend", this.move);

    //Auto-enable based on device width
    const pwMax = getComputedStyle(document.body).getPropertyValue(
      "--phone-max-width",
    );
    this.media = matchMedia(`(max-width: ${pwMax}`);
    this.media.onchange = (e) => this.setEnabled(e.matches);
    this.setEnabled(this.media.matches);
  }

  private start(e: TouchEvent) {
    //Cancel if more than one finger
    if (e.touches.length > 1) return this.endTouch();
    if (this.touch || !this.enabled) return;

    //Track this touch
    const t = e.touches[0];
    this.touch = {
      id: t.identifier,
      x: t.screenX,
      y: t.screenY,
    };

    console.log("TSTART", this.touch.x, this.touch.y);
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
      console.log("CANCEL at Y", dy);
      this.endTouch();
    } else if (trig || Math.abs(dx) > TRIG_X) {
      //Store new/prev X for vel calc
      const type = trig ? "new" : "prev";
      t[`${type}X`] = dx;
      t[`${type}T`] = performance.now();

      if (!trig) {
        console.log("TRIG at X", dx);
        t.trig = trig = true;
        this.tfTimer();
        this.velTimer();
      }

      dx = Math.max(Math.min(this.ofs + dx, 0), max);
      ds.transform = `translateX(${dx}px)`;
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
        console.log("END at X", dx, vel);
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
        }, ANIM_MS + 50)
      : null;
  }

  private setElState(show: boolean) {
    const ds = this.drawer.style;
    this.root.style.width = show ? "" : "200vw";
    ds.marginLeft = show ? "" : "100vw";
  }

  delete() {
    console.log("DEL");
    this.setEnabled(false);
    this.root.removeEventListener("touchstart", this.start);
    this.root.removeEventListener("touchmove", this.move);
    this.root.removeEventListener("touchend", this.move);
    this.media.onchange = null;
  }

  setEnabled(en: boolean) {
    if (this.enabled !== en) {
      this.drawer.style.zIndex = en ? "1" : "";
      this.tfTimer();
      this.endTouch();
      if (!en) this.setElState(true);
      this.ofs = 0;
    }
    this.enabled = en;
    if (this.onStateChanged) this.onStateChanged(en);
  }

  isShown() {
    return this.ofs !== 0;
  }

  setShown(show: boolean) {
    if (!this.enabled || this.touch?.trig || this.tTmr) return false;
    if (this.isShown() !== show) {
      this.setElState(false);
      this.drawer.style.transform = `translateX(${this.ofs}px)`;
      setTimeout(() => this.tfTimer(true, show), 0);
    }
    return true;
  }
}
