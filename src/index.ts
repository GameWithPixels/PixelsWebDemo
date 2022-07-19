if (process.env.NODE_ENV === "development") {
  require("preact/debug");
}
import "./style/index.css";
import App from "./components/app";

export default App;
