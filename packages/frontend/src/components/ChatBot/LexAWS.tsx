import { useEffect } from "react"
import "./iframe.css"

declare global {
  interface Window {
    ChatBotUiLoader: {
      IframeLoader: (opts: object) => {
        load: (opts: object) => Promise<void>
      }
    }
  }
}

const LexAWS = () => {
  
  useEffect(() => {
    const iframeContainer = document.getElementById("lex-web-ui-iframe")
    const script = document.createElement("script")
    script.src = "https://d11yta04pbf38e.cloudfront.net/lex-web-ui-loader.min.js"
    script.async = true
    iframeContainer?.appendChild(script)
    script.onload = () => {
      const loaderOpts = {
        baseUrl: 'https://d11yta04pbf38e.cloudfront.net/',
        shouldLoadMinDeps: true,
      };
      const loader = new window.ChatBotUiLoader.IframeLoader(loaderOpts);
      console.log("loader: ", loader)
      console.log(import.meta.env.BOT_ID)
      const chatbotUiConfig = {
        ui: {
          parentOrigin: window.location.origin,
        },
        // lex: {
        //   v2BotId: "WVXHQBYDD5",
        //   v2BotAliasId: "MCNSNFEXV0",
        // }
              /* Example of setting session attributes on parent page
              lex: {
                sessionAttributes: {
                  userAgent: navigator.userAgent,
                  QNAClientFilter: ''
                }
              }
              */
            };
      loader.load(chatbotUiConfig)
        .then(() => loader.api.ping())
        .catch(function (error: unknown) { console.error("Error while loading: ", error); });
    }
    return () => {
      iframeContainer?.removeChild(script)
    }
  }, [])


  document.addEventListener("lexWebUiReady", (event) => {
    // if (event.data.event) {
    //   console.log("Message event: ", event.data.event)
    // }
    console.log("Web ui is ready: ", event)
  })
  document.addEventListener("message", (event) => {
    // if (event.data.event) {
    //   console.log("Message event: ", event.data.event)
    // }
    console.log("Message: ", event)
  })
  document.addEventListener("updatelexstate", (event: any) => {
    console.log("Event: ", event)
    console.log(event.detail.state.sessionAttributes)
  }, false)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
      id="lex-web-ui-iframe"
    >
      {/* <iframe */}
      {/*   style={{ */}
      {/*     width: "100%", */}
      {/*     height: "100%", */}
      {/*   }} */}
      {/*   src="https://d2s64hej98v33o.cloudfront.net/index.html"></iframe> */}
    </div>
  )
}
export default LexAWS;
