import { useEffect } from "react";
import "./splash.css";
import logo from "./bean-logo.png";

/**
 * <BeanOSSplash onFinish={() => setReady(true)} duration={2600} version="v1.0" />
 * Calls onFinish after `duration` ms (min display time). If your app needs to
 * load data first, you can also wait for it and only then flip your state.
 */
export default function BeanOSSplash({ onFinish, duration = 2600, version = "v1.0" }) {
  useEffect(() => {
    if (!onFinish) return;
    const t = setTimeout(onFinish, duration);
    return () => clearTimeout(t);
  }, [onFinish, duration]);

  return (
    <div className="bs-root">
      <div className="bs-glow" />
      <img className="bs-logo" src={logo} alt="BeanOS" />
      <div className="bs-word">BEAN<span>OS</span></div>
      <div className="bs-tag">Brew · Sell · Grow</div>
      <div className="bs-foot">
        <div className="bs-bar"><i /></div>
        <div className="bs-ver">{version}</div>
      </div>
    </div>
  );
}
