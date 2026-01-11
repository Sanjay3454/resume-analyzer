import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, Link, useNavigate, useLocation, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { create } from "zustand";
import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const getPuter = () => typeof window !== "undefined" && window.puter ? window.puter : null;
const usePuterStore = create((set, get) => {
  const setError = (msg) => {
    set({
      error: msg,
      isLoading: false,
      auth: {
        user: null,
        isAuthenticated: false,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: get().auth.getUser
      }
    });
  };
  const checkAuthStatus = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return false;
    }
    set({ isLoading: true, error: null });
    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        set({
          auth: {
            user,
            isAuthenticated: true,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => user
          },
          isLoading: false
        });
        return true;
      } else {
        set({
          auth: {
            user: null,
            isAuthenticated: false,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => null
          },
          isLoading: false
        });
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to check auth status";
      setError(msg);
      return false;
    }
  };
  const signIn = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signIn();
      await checkAuthStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
    }
  };
  const signOut = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signOut();
      set({
        auth: {
          user: null,
          isAuthenticated: false,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => null
        },
        isLoading: false
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign out failed";
      setError(msg);
    }
  };
  const refreshUser = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const user = await puter.auth.getUser();
      set({
        auth: {
          user,
          isAuthenticated: true,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => user
        },
        isLoading: false
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refresh user";
      setError(msg);
    }
  };
  const init = () => {
    const puter = getPuter();
    if (puter) {
      set({ puterReady: true });
      checkAuthStatus();
      return;
    }
    const interval = setInterval(() => {
      if (getPuter()) {
        clearInterval(interval);
        set({ puterReady: true });
        checkAuthStatus();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      if (!getPuter()) {
        setError("Puter.js failed to load within 10 seconds");
      }
    }, 1e4);
  };
  const write = async (path, data) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.write(path, data);
  };
  const readDir = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.readdir(path);
  };
  const readFile = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.read(path);
  };
  const upload2 = async (files) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.upload(files);
  };
  const deleteFile = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.delete(path);
  };
  const chat = async (prompt, imageURL, testMode, options) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.chat(prompt, imageURL, testMode, options);
  };
  const feedback = async (path, message) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.chat(message);
  };
  const img2txt = async (image, testMode) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.img2txt(image, testMode);
  };
  const getKV = async (key) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.get(key);
  };
  const setKV = async (key, value) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.set(key, value);
  };
  const deleteKV = async (key) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.delete(key);
  };
  const listKV = async (pattern, returnValues) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    if (returnValues === void 0) {
      returnValues = false;
    }
    return puter.kv.list(pattern, returnValues);
  };
  const flushKV = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.flush();
  };
  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser,
      checkAuthStatus,
      getUser: () => get().auth.user
    },
    fs: {
      write: (path, data) => write(path, data),
      read: (path) => readFile(path),
      readDir: (path) => readDir(path),
      upload: (files) => upload2(files),
      delete: (path) => deleteFile(path)
    },
    ai: {
      chat: (prompt, imageURL, testMode, options) => chat(prompt, imageURL, testMode, options),
      feedback: (path, message) => feedback(path, message),
      img2txt: (image, testMode) => img2txt(image, testMode)
    },
    kv: {
      get: (key) => getKV(key),
      set: (key, value) => setKV(key, value),
      delete: (key) => deleteKV(key),
      list: (pattern, returnValues) => listKV(pattern, returnValues),
      flush: () => flushKV()
    },
    init,
    clearError: () => set({ error: null })
  };
});
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  const {
    init
  } = usePuterStore();
  useEffect(() => {
    init();
  }, [init]);
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx("script", {
        src: "https://js.puter.com/v2/"
      }), children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const Navbar = () => {
  return /* @__PURE__ */ jsx("nav", { className: "border-b border-slate-200 bg-white", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center h-16", children: [
    /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center", children: /* @__PURE__ */ jsx("span", { className: "text-xl font-bold tracking-tight text-slate-900", children: "RESUMIND" }) }),
    /* @__PURE__ */ jsx(Link, { to: "/upload", className: "btn btn-primary", children: "Upload Resume" })
  ] }) }) });
};
const ScoreCircle = ({ score = 75 }) => {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);
  const getColor = (s) => {
    if (s >= 70) return "#10b981";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };
  const strokeColor = getColor(score);
  return /* @__PURE__ */ jsxs("div", { className: "relative w-[80px] h-[80px]", children: [
    /* @__PURE__ */ jsxs(
      "svg",
      {
        height: "100%",
        width: "100%",
        viewBox: "0 0 100 100",
        className: "transform -rotate-90",
        children: [
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: normalizedRadius,
              stroke: "#f1f5f9",
              strokeWidth: stroke,
              fill: "transparent"
            }
          ),
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: normalizedRadius,
              stroke: strokeColor,
              strokeWidth: stroke,
              fill: "transparent",
              strokeDasharray: circumference,
              strokeDashoffset,
              strokeLinecap: "round",
              className: "transition-all duration-1000 ease-out"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-slate-900", children: score }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-medium", children: "Score" })
    ] })
  ] });
};
const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }) => {
  const { fs } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState("");
  useEffect(() => {
    const loadResume = async () => {
      if (!imagePath) return;
      const blob = await fs.read(imagePath);
      if (!blob) return;
      let url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };
    loadResume();
  }, [imagePath]);
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: `/resume/${id}`,
      className: "group card hover:border-brand-300 hover:ring-1 hover:ring-brand-300 transition-all duration-200 block h-full flex flex-col",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "card-header flex justify-between items-start gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-slate-900 truncate", children: companyName || "Untitled Application" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 truncate", children: jobTitle || "Resume Analysis" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(ScoreCircle, { score: feedback.overallScore }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 flex-1 bg-slate-50 flex items-center justify-center overflow-hidden", children: resumeUrl ? /* @__PURE__ */ jsxs("div", { className: "relative w-full aspect-[3/4] shadow-sm rounded-lg overflow-hidden ring-1 ring-slate-200 bg-white", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: resumeUrl,
              alt: "resume thumbnail",
              className: "w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "w-full aspect-[3/4] rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400", children: /* @__PURE__ */ jsx("span", { className: "text-sm", children: "No Preview" }) }) })
      ]
    }
  );
};
function meta$2({}) {
  return [{
    title: "Resumind"
  }, {
    name: "description",
    content: "Smart feedback for your dream job!"
  }];
}
const home = UNSAFE_withComponentProps(function Home() {
  const {
    auth: auth2,
    kv
  } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  useEffect(() => {
    if (!auth2.isAuthenticated) navigate("/auth?next=/");
  }, [auth2.isAuthenticated, navigate]);
  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      try {
        const resumes2 = await kv.list("resume:*", true);
        const parsedResumes = (resumes2 == null ? void 0 : resumes2.map((resume2) => JSON.parse(resume2.value))) || [];
        setResumes(parsedResumes);
      } catch (err) {
        console.error("Failed to load resumes", err);
      } finally {
        setLoadingResumes(false);
      }
    };
    loadResumes();
  }, []);
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-slate-50 flex flex-col",
    children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 container-main w-full",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "py-12 text-center max-w-3xl mx-auto mb-12",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "mb-4",
          children: "Track your applications & ratings"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-xl text-slate-600",
          children: !loadingResumes && resumes.length === 0 ? "Upload your first resume to get AI-powered feedback." : "Review your submissions and improve your score."
        })]
      }), loadingResumes ? /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center justify-center py-20",
        children: [/* @__PURE__ */ jsxs("svg", {
          className: "animate-spin h-10 w-10 text-brand-600 mb-4",
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          children: [/* @__PURE__ */ jsx("circle", {
            className: "opacity-25",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }), /* @__PURE__ */ jsx("path", {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-slate-500",
          children: "Loading your resumes..."
        })]
      }) : /* @__PURE__ */ jsx(Fragment, {
        children: resumes.length > 0 ? /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
          children: [resumes.map((resume2) => /* @__PURE__ */ jsx(ResumeCard, {
            resume: resume2
          }, resume2.id)), /* @__PURE__ */ jsxs(Link, {
            to: "/upload",
            className: "group border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer min-h-[300px]",
            children: [/* @__PURE__ */ jsx("div", {
              className: "bg-slate-100 p-4 rounded-full group-hover:bg-brand-100 transition-colors mb-4",
              children: /* @__PURE__ */ jsx("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                className: "h-8 w-8 text-slate-400 group-hover:text-brand-600",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsx("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 4v16m8-8H4"
                })
              })
            }), /* @__PURE__ */ jsx("span", {
              className: "font-medium text-slate-900 group-hover:text-brand-700",
              children: "Analyze New Resume"
            })]
          })]
        }) : /* @__PURE__ */ jsx("div", {
          className: "flex flex-col items-center justify-center mt-10 gap-6",
          children: /* @__PURE__ */ jsxs("div", {
            className: "bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg",
            children: [/* @__PURE__ */ jsx("div", {
              className: "bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
              children: /* @__PURE__ */ jsx("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                className: "h-8 w-8 text-brand-600",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsx("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                })
              })
            }), /* @__PURE__ */ jsx("h3", {
              className: "mb-2",
              children: "No resumes yet"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-slate-500 mb-8",
              children: "Upload your resume to get instant feedback on your ATS score, formatting, and content."
            }), /* @__PURE__ */ jsx(Link, {
              to: "/upload",
              className: "btn btn-primary btn-large w-full",
              children: "Upload Resume"
            })]
          })
        })
      })]
    })]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const meta$1 = () => [{
  title: "Resumind | Sign In"
}, {
  name: "description",
  content: "Log into your account"
}];
const Auth = () => {
  const {
    isLoading,
    auth: auth2
  } = usePuterStore();
  const location = useLocation();
  const next = location.search.split("next=")[1] || "/";
  const navigate = useNavigate();
  useEffect(() => {
    if (auth2.isAuthenticated) navigate(next);
  }, [auth2.isAuthenticated, next, navigate]);
  return /* @__PURE__ */ jsxs("main", {
    className: "min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "sm:mx-auto sm:w-full sm:max-w-md",
      children: [/* @__PURE__ */ jsx(Link, {
        to: "/",
        className: "flex justify-center",
        children: /* @__PURE__ */ jsx("span", {
          className: "text-3xl font-bold tracking-tight text-slate-900",
          children: "RESUMIND"
        })
      }), /* @__PURE__ */ jsx("h2", {
        className: "mt-6 text-center text-3xl font-bold tracking-tight text-slate-900",
        children: "Sign in to your account"
      }), /* @__PURE__ */ jsxs("p", {
        className: "mt-2 text-center text-sm text-slate-600",
        children: ["Or ", /* @__PURE__ */ jsx(Link, {
          to: "/",
          className: "font-medium text-brand-600 hover:text-brand-500",
          children: "return to home"
        })]
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "mt-8 sm:mx-auto sm:w-full sm:max-w-md",
      children: /* @__PURE__ */ jsx("div", {
        className: "bg-white py-8 px-4 shadow rounded-lg sm:px-10 border border-slate-200",
        children: /* @__PURE__ */ jsxs("div", {
          className: "space-y-6",
          children: [isLoading ? /* @__PURE__ */ jsxs("button", {
            disabled: true,
            className: "btn btn-primary w-full opacity-75 cursor-not-allowed",
            children: [/* @__PURE__ */ jsxs("svg", {
              className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white",
              xmlns: "http://www.w3.org/2000/svg",
              fill: "none",
              viewBox: "0 0 24 24",
              children: [/* @__PURE__ */ jsx("circle", {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
              }), /* @__PURE__ */ jsx("path", {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              })]
            }), "Connecting..."]
          }) : /* @__PURE__ */ jsx(Fragment, {
            children: auth2.isAuthenticated ? /* @__PURE__ */ jsx("button", {
              className: "btn btn-secondary w-full",
              onClick: auth2.signOut,
              children: "Sign out"
            }) : /* @__PURE__ */ jsx("button", {
              className: "btn btn-primary w-full justify-center text-lg",
              onClick: auth2.signIn,
              children: "Sign in with Puter"
            })
          }), !auth2.isAuthenticated && /* @__PURE__ */ jsx("div", {
            className: "mt-6",
            children: /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx("div", {
                className: "absolute inset-0 flex items-center",
                children: /* @__PURE__ */ jsx("div", {
                  className: "w-full border-t border-gray-300"
                })
              }), /* @__PURE__ */ jsx("div", {
                className: "relative flex justify-center text-sm",
                children: /* @__PURE__ */ jsx("span", {
                  className: "bg-white px-2 text-slate-500",
                  children: "Secure access via Puter.com"
                })
              })]
            })
          })]
        })
      })
    })]
  });
};
const auth = UNSAFE_withComponentProps(Auth);
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: auth,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
const generateUUID = () => crypto.randomUUID();
const FileUploader = ({ onFileSelect }) => {
  const onDrop = useCallback((acceptedFiles2) => {
    const file2 = acceptedFiles2[0] || null;
    onFileSelect == null ? void 0 : onFileSelect(file2);
  }, [onFileSelect]);
  const maxFileSize = 20 * 1024 * 1024;
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxFileSize
  });
  const file = acceptedFiles[0] || null;
  return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs(
    "div",
    {
      ...getRootProps(),
      className: `
                    relative group cursor-pointer transition-all duration-200 ease-in-out
                    border-2 border-dashed rounded-xl p-12 text-center
                    flex flex-col items-center justify-center gap-4
                    ${isDragActive ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-white hover:border-brand-500 hover:bg-slate-50"}
                `,
      children: [
        /* @__PURE__ */ jsx("input", { ...getInputProps() }),
        file ? /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md mx-auto bg-slate-100 rounded-lg p-4 flex items-center justify-between group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200 shadow-sm", onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-rose-100 rounded-lg", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "w-6 h-6 text-rose-500", children: [
              /* @__PURE__ */ jsx("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }),
              /* @__PURE__ */ jsx("polyline", { points: "14 2 14 8 20 8" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-left min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-900 truncate", children: file.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: formatSize(file.size) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "p-1.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-rose-500 transition-colors",
              onClick: (e) => {
                e.stopPropagation();
                onFileSelect == null ? void 0 : onFileSelect(null);
              },
              children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
              ] })
            }
          )
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 rounded-full bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
            /* @__PURE__ */ jsx("polyline", { points: "17 8 12 3 7 8" }),
            /* @__PURE__ */ jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-lg font-medium text-slate-900", children: "Click to upload or drag and drop" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
              "PDF up to ",
              formatSize(maxFileSize)
            ] })
          ] })
        ] })
      ]
    }
  ) });
};
let pdfjsLib = null;
let loadPromise = null;
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    pdfjsLib = lib;
    return lib;
  });
  return loadPromise;
}
async function convertPdfToImage(file) {
  try {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    }
    await page.render({ canvasContext: context, viewport }).promise;
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png"
            });
            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob"
            });
          }
        },
        "image/png",
        1
      );
    });
  } catch (err) {
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err}`
    };
  }
}
async function extractTextFromPdf(file) {
  try {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  } catch (err) {
    console.error("Failed to extract text from PDF:", err);
    return "";
  }
}
const prepareInstructions = ({ jobTitle, jobDescription, resumeText }) => {
  return `
    You are an expert resume analyzer and career coach. Your task is to analyze the provided resume against the following job details:
    Job Title: ${jobTitle || "General Role"}
    Job Description: ${jobDescription || "Standard industry requirements for this role"}

    Resume Content:
    ${resumeText || "No resume content provided."}

    Please provide a detailed analysis in the following JSON format. IMPORTANT: Return ONLY valid JSON. Do not wrap it in markdown code blocks (e.g. \`\`\`json). Do not include any intro or outro text.
    
    Structure the JSON as follows:
    {
      "overallScore": number (0-100),
      "toneAndStyle": {
        "score": number (0-100),
        "tips": [
          { "type": "good" | "improve", "tip": "short tip title", "explanation": "detailed explanation" }
        ]
      },
      "content": {
        "score": number (0-100),
        "tips": [ ... ]
      },
      "structure": {
        "score": number (0-100),
        "tips": [ ... ]
      },
      "skills": {
        "score": number (0-100),
        "tips": [ ... ]
      },
      "ATS": {
        "score": number (0-100),
        "tips": [
          { "type": "good" | "improve", "tip": "short tip title" }
        ]
      }
    }

    Ensure the feedback is constructive, actionable, and specific to the resume and job description provided.
  `;
};
const Upload = () => {
  const {
    auth: auth2,
    fs,
    ai,
    kv
  } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState(null);
  const handleFileSelect = (file2) => {
    setFile(file2);
  };
  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file: file2
  }) => {
    setIsProcessing(true);
    try {
      setStatusText("Uploading the file...");
      const uploadedFile = await fs.upload([file2]);
      if (!uploadedFile) throw new Error("Failed to upload file");
      setStatusText("Converting PDF to image...");
      const imageFile = await convertPdfToImage(file2);
      if (imageFile.error || !imageFile.file) throw new Error(imageFile.error || "Failed to convert PDF");
      setStatusText("Extracting text...");
      const resumeText = await extractTextFromPdf(file2);
      if (!resumeText) console.warn("Could not extract text from PDF");
      setStatusText("Uploading preview...");
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) throw new Error("Failed to upload preview image");
      setStatusText("Initializing analysis...");
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: ""
      };
      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText("Generating AI feedback...");
      const feedback = await ai.feedback(uploadedFile.path, prepareInstructions({
        jobTitle,
        jobDescription,
        resumeText: resumeText || ""
      }));
      if (!feedback) throw new Error("Failed to get AI feedback");
      let feedbackText = typeof feedback.message.content === "string" ? feedback.message.content : feedback.message.content[0].text;
      feedbackText = feedbackText.replace(/```json\n?|```/g, "").trim();
      data.feedback = JSON.parse(feedbackText);
      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText("Finalizing...");
      navigate(`/resume/${uuid}`);
    } catch (error) {
      console.error(error);
      setStatusText(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name");
    const jobTitle = formData.get("job-title");
    const jobDescription = formData.get("job-description");
    if (!file) return;
    handleAnalyze({
      companyName,
      jobTitle,
      jobDescription,
      file
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-slate-50 flex flex-col",
    children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsx("main", {
      className: "flex-1 container-main py-12",
      children: /* @__PURE__ */ jsxs("div", {
        className: "max-w-2xl mx-auto",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "text-center mb-10",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "mb-2",
            children: "New Analysis"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-lg text-slate-600",
            children: "Upload your resume to get detailed feedback tailored to the job description."
          })]
        }), isProcessing ? /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex justify-center mb-6",
            children: /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx("div", {
                className: "w-24 h-24 rounded-full border-4 border-slate-100"
              }), /* @__PURE__ */ jsx("div", {
                className: "w-24 h-24 rounded-full border-4 border-brand-600 border-t-transparent animate-spin absolute inset-0"
              })]
            })
          }), /* @__PURE__ */ jsx("h2", {
            className: "text-2xl font-bold text-slate-900 mb-2",
            children: "Analyzing Resume"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-slate-500 animate-pulse",
            children: statusText
          })]
        }) : /* @__PURE__ */ jsx("div", {
          className: "bg-white rounded-xl shadow-sm border border-slate-200 p-8",
          children: /* @__PURE__ */ jsxs("form", {
            id: "upload-form",
            onSubmit: handleSubmit,
            className: "space-y-6",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsxs("label", {
                htmlFor: "company-name",
                className: "label-text",
                children: ["Company Name ", /* @__PURE__ */ jsx("span", {
                  className: "text-slate-400 font-normal",
                  children: "(Optional)"
                })]
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                name: "company-name",
                placeholder: "e.g. Acme Corp",
                id: "company-name",
                className: "input-field"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsxs("label", {
                htmlFor: "job-title",
                className: "label-text",
                children: ["Job Title ", /* @__PURE__ */ jsx("span", {
                  className: "text-slate-400 font-normal",
                  children: "(Optional)"
                })]
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                name: "job-title",
                placeholder: "e.g. Senior Frontend Engineer",
                id: "job-title",
                className: "input-field"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsxs("label", {
                htmlFor: "job-description",
                className: "label-text",
                children: ["Job Description ", /* @__PURE__ */ jsx("span", {
                  className: "text-slate-400 font-normal",
                  children: "(Optional)"
                })]
              }), /* @__PURE__ */ jsx("textarea", {
                rows: 6,
                name: "job-description",
                placeholder: "Paste the job description here...",
                id: "job-description",
                className: "input-field resize-y"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-xs text-slate-500 mt-1",
                children: "Include key requirements and skills for best results."
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "pt-2",
              children: [/* @__PURE__ */ jsx("label", {
                className: "label-text mb-2 block",
                children: "Resume PDF"
              }), /* @__PURE__ */ jsx(FileUploader, {
                onFileSelect: handleFileSelect
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "pt-4",
              children: /* @__PURE__ */ jsx("button", {
                className: "btn btn-primary w-full btn-large shadow-brand-200 shadow-lg hover:shadow-xl transition-all",
                type: "submit",
                disabled: !file,
                children: "Start Analysis"
              })
            })]
          })
        })]
      })
    })]
  });
};
const upload = UNSAFE_withComponentProps(Upload);
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: upload
}, Symbol.toStringTag, { value: "Module" }));
const ScoreGauge = ({ score = 75 }) => {
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef(null);
  const percentage = score / 100;
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);
  let startColor = "#ef4444";
  let endColor = "#fca5a5";
  if (score > 69) {
    startColor = "#10b981";
    endColor = "#34d399";
  } else if (score > 49) {
    startColor = "#f59e0b";
    endColor = "#fbbf24";
  }
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center", children: /* @__PURE__ */ jsxs("div", { className: "relative w-40 h-20 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 100 50", className: "w-full h-full text-slate-200", children: [
      /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs(
        "linearGradient",
        {
          id: "gaugeGradient",
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "0%",
          children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: startColor }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: endColor })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M10,50 A40,40 0 0,1 90,50",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "10",
          strokeLinecap: "round"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          ref: pathRef,
          d: "M10,50 A40,40 0 0,1 90,50",
          fill: "none",
          stroke: "url(#gaugeGradient)",
          strokeWidth: "10",
          strokeLinecap: "round",
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength * (1 - percentage),
          className: "transition-all duration-1000 ease-out"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 flex flex-col items-center justify-end", children: /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-slate-900 leading-none", children: score }) })
  ] }) });
};
const ScoreBadge = ({ score }) => {
  let badgeClasses = "";
  let badgeText = "";
  if (score > 70) {
    badgeClasses = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    badgeText = "Strong";
  } else if (score > 49) {
    badgeClasses = "bg-amber-50 text-amber-700 ring-amber-600/20";
    badgeText = "Good Start";
  } else {
    badgeClasses = "bg-rose-50 text-rose-700 ring-rose-600/20";
    badgeText = "Needs Work";
  }
  return /* @__PURE__ */ jsx("div", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${badgeClasses}`, children: badgeText });
};
const Category = ({ title, score }) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-3 border-b border-slate-100 last:border-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-700", children: title }),
      /* @__PURE__ */ jsx(ScoreBadge, { score })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold text-slate-900", children: [
      score,
      "/100"
    ] })
  ] });
};
const Summary = ({ feedback }) => {
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center gap-6 mb-6", children: [
      /* @__PURE__ */ jsx(ScoreGauge, { score: feedback.overallScore }),
      /* @__PURE__ */ jsxs("div", { className: "text-center md:text-left", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900", children: "Overall Score" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Based on industry standards and job description relevance." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Category, { title: "Tone & Style", score: feedback.toneAndStyle.score }),
      /* @__PURE__ */ jsx(Category, { title: "Content", score: feedback.content.score }),
      /* @__PURE__ */ jsx(Category, { title: "Structure", score: feedback.structure.score }),
      /* @__PURE__ */ jsx(Category, { title: "Skills", score: feedback.skills.score })
    ] })
  ] });
};
const ATS = ({ score, suggestions }) => {
  const isGood = score > 69;
  const isOk = score > 49;
  let accentColor = "text-rose-600";
  let bgClass = "bg-rose-50 border-rose-100";
  let title = "Needs Improvement";
  if (isGood) {
    accentColor = "text-emerald-600";
    bgClass = "bg-emerald-50 border-emerald-100";
    title = "ATS Optimized";
  } else if (isOk) {
    accentColor = "text-amber-600";
    bgClass = "bg-amber-50 border-amber-100";
    title = "Needs Work";
  }
  return /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-6 ${bgClass}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mb-4", children: [
      /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg bg-white ${accentColor}`, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-900", children: [
          title,
          " (",
          score,
          "/100)"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 mt-1", children: "Likelihood to pass automated ATS filters." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 pl-1", children: suggestions.map((suggestion, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: `mt-0.5 flex-shrink-0 ${suggestion.type === "good" ? "text-emerald-600" : "text-amber-600"}`, children: suggestion.type === "good" ? /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) : /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-700 leading-relaxed", children: suggestion.tip })
    ] }, index)) })
  ] });
};
const AccordionContext = createContext(
  void 0
);
const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
};
const Accordion = ({
  children,
  defaultOpen,
  allowMultiple = false,
  className = ""
}) => {
  const [activeItems, setActiveItems] = useState(
    defaultOpen ? [defaultOpen] : []
  );
  const toggleItem = (id) => {
    setActiveItems((prev) => {
      if (allowMultiple) {
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      } else {
        return prev.includes(id) ? [] : [id];
      }
    });
  };
  const isItemActive = (id) => activeItems.includes(id);
  return /* @__PURE__ */ jsx(
    AccordionContext.Provider,
    {
      value: { activeItems, toggleItem, isItemActive },
      children: /* @__PURE__ */ jsx("div", { className: `space-y-2 ${className}`, children })
    }
  );
};
const AccordionItem = ({
  id,
  children,
  className = ""
}) => {
  return /* @__PURE__ */ jsx("div", { className: `overflow-hidden border-b border-gray-200 ${className}`, children });
};
const AccordionHeader = ({
  itemId,
  children,
  className = "",
  icon,
  iconPosition = "right"
}) => {
  const { toggleItem, isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);
  const defaultIcon = /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("w-5 h-5 transition-transform duration-200", {
        "rotate-180": isActive
      }),
      fill: "none",
      stroke: "#98A2B3",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M19 9l-7 7-7-7"
        }
      )
    }
  );
  const handleClick = () => {
    toggleItem(itemId);
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: handleClick,
      className: `
        w-full px-4 py-3 text-left
        focus:outline-none
        transition-colors duration-200 flex items-center justify-between cursor-pointer
        ${className}
      `,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          iconPosition === "left" && (icon || defaultIcon),
          /* @__PURE__ */ jsx("div", { className: "flex-1", children })
        ] }),
        iconPosition === "right" && (icon || defaultIcon)
      ]
    }
  );
};
const AccordionContent = ({
  itemId,
  children,
  className = ""
}) => {
  const { isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `
        overflow-hidden transition-all duration-300 ease-in-out
        ${isActive ? "max-h-fit opacity-100" : "max-h-0 opacity-0"}
        ${className}
      `,
      children: /* @__PURE__ */ jsx("div", { className: "px-4 py-3 ", children })
    }
  );
};
const CategoryHeader = ({
  title,
  categoryScore
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-4 items-center w-full", children: [
    /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-slate-800", children: title }),
    /* @__PURE__ */ jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsx(ScoreBadge, { score: categoryScore }) })
  ] });
};
const CategoryContent = ({
  tips
}) => {
  return /* @__PURE__ */ jsx("div", { className: "space-y-4 pt-2 pb-4", children: tips.map((tip, index) => {
    const isGood = tip.type === "good";
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "flex flex-col gap-2 rounded-lg p-4 border",
          isGood ? "bg-slate-50 border-emerald-200" : "bg-slate-50 border-amber-200"
        ),
        children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: cn("mt-1 p-1 rounded-full flex-shrink-0 h-fit", isGood ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"), children: isGood ? /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) : /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: cn("font-medium text-base", isGood ? "text-emerald-900" : "text-amber-900"), children: tip.tip }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 mt-1 leading-relaxed", children: tip.explanation })
          ] })
        ] })
      },
      index + tip.tip
    );
  }) });
};
const Details = ({ feedback }) => {
  return /* @__PURE__ */ jsxs("div", { className: "card w-full overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "px-6 py-4 border-b border-slate-100 bg-slate-50/50", children: /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-900", children: "Detailed Feedback" }) }),
    /* @__PURE__ */ jsxs(Accordion, { className: "divide-y divide-slate-100", children: [
      /* @__PURE__ */ jsxs(AccordionItem, { id: "tone-style", className: "border-none", children: [
        /* @__PURE__ */ jsx(AccordionHeader, { itemId: "tone-style", className: "hover:bg-slate-50", children: /* @__PURE__ */ jsx(
          CategoryHeader,
          {
            title: "Tone & Style",
            categoryScore: feedback.toneAndStyle.score
          }
        ) }),
        /* @__PURE__ */ jsx(AccordionContent, { itemId: "tone-style", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.toneAndStyle.tips }) })
      ] }),
      /* @__PURE__ */ jsxs(AccordionItem, { id: "content", className: "border-none", children: [
        /* @__PURE__ */ jsx(AccordionHeader, { itemId: "content", className: "hover:bg-slate-50", children: /* @__PURE__ */ jsx(
          CategoryHeader,
          {
            title: "Content",
            categoryScore: feedback.content.score
          }
        ) }),
        /* @__PURE__ */ jsx(AccordionContent, { itemId: "content", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.content.tips }) })
      ] }),
      /* @__PURE__ */ jsxs(AccordionItem, { id: "structure", className: "border-none", children: [
        /* @__PURE__ */ jsx(AccordionHeader, { itemId: "structure", className: "hover:bg-slate-50", children: /* @__PURE__ */ jsx(
          CategoryHeader,
          {
            title: "Structure",
            categoryScore: feedback.structure.score
          }
        ) }),
        /* @__PURE__ */ jsx(AccordionContent, { itemId: "structure", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.structure.tips }) })
      ] }),
      /* @__PURE__ */ jsxs(AccordionItem, { id: "skills", className: "border-none", children: [
        /* @__PURE__ */ jsx(AccordionHeader, { itemId: "skills", className: "hover:bg-slate-50", children: /* @__PURE__ */ jsx(
          CategoryHeader,
          {
            title: "Skills",
            categoryScore: feedback.skills.score
          }
        ) }),
        /* @__PURE__ */ jsx(AccordionContent, { itemId: "skills", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.skills.tips }) })
      ] })
    ] })
  ] });
};
const meta = () => [{
  title: "Resumind | Review "
}, {
  name: "description",
  content: "Detailed overview of your resume"
}];
const Resume = () => {
  const {
    auth: auth2,
    isLoading,
    fs,
    kv
  } = usePuterStore();
  const {
    id
  } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !auth2.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading, auth2.isAuthenticated, navigate, id]);
  useEffect(() => {
    const loadResume = async () => {
      const resume2 = await kv.get(`resume:${id}`);
      if (!resume2) return;
      const data = JSON.parse(resume2);
      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;
      const pdfBlob = new Blob([resumeBlob], {
        type: "application/pdf"
      });
      const resumeUrl2 = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl2);
      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;
      const imageUrl2 = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl2);
      setFeedback(data.feedback);
    };
    loadResume();
  }, [id]);
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-slate-50 flex flex-col",
    children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsx("main", {
      className: "flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8",
      children: /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)] min-h-[600px]",
        children: [/* @__PURE__ */ jsx("div", {
          className: "lg:col-span-5 h-full flex flex-col",
          children: /* @__PURE__ */ jsxs("div", {
            className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full sticky top-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50",
              children: [/* @__PURE__ */ jsx("h2", {
                className: "font-semibold text-slate-700",
                children: "Resume Preview"
              }), resumeUrl && /* @__PURE__ */ jsx("a", {
                href: resumeUrl,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-brand-600 hover:text-brand-700 text-sm font-medium",
                children: "Open PDF ↗"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "flex-1 overflow-auto bg-slate-200 p-4 flex items-start justify-center",
              children: imageUrl ? /* @__PURE__ */ jsx("img", {
                src: imageUrl,
                className: "w-full max-w-full shadow-lg rounded-sm",
                alt: "resume preview"
              }) : /* @__PURE__ */ jsx("div", {
                className: "flex items-center justify-center h-full text-slate-400",
                children: "Loading preview..."
              })
            })]
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "lg:col-span-7 h-full overflow-y-auto pr-2 custom-scrollbar",
          children: /* @__PURE__ */ jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("h1", {
                className: "text-2xl font-bold text-slate-900",
                children: "Analysis Results"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-sm text-slate-500",
                children: "Generated by AI"
              })]
            }), feedback ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(Summary, {
                feedback
              }), /* @__PURE__ */ jsx(ATS, {
                score: feedback.ATS.score || 0,
                suggestions: feedback.ATS.tips || []
              }), /* @__PURE__ */ jsx(Details, {
                feedback
              })]
            }) : /* @__PURE__ */ jsxs("div", {
              className: "card p-12 flex flex-col items-center justify-center text-center space-y-4",
              children: [/* @__PURE__ */ jsx("div", {
                className: "w-16 h-16 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-lg font-medium text-slate-900",
                children: "Analyzing your resume..."
              }), /* @__PURE__ */ jsx("p", {
                className: "text-slate-500 max-w-sm",
                children: "This usually takes about 10-20 seconds. We're checking against ATS standards and job requirements."
              })]
            })]
          })
        })]
      })
    })]
  });
};
const resume = UNSAFE_withComponentProps(Resume);
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: resume,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const WipeApp = () => {
  var _a;
  const {
    auth: auth2,
    isLoading,
    error,
    clearError,
    fs,
    ai,
    kv
  } = usePuterStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const loadFiles = async () => {
    const files2 = await fs.readDir("./");
    setFiles(files2);
  };
  useEffect(() => {
    loadFiles();
  }, []);
  useEffect(() => {
    if (!isLoading && !auth2.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading]);
  const handleDelete = async () => {
    files.forEach(async (file) => {
      await fs.delete(file.path);
    });
    await kv.flush();
    loadFiles();
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", {
      children: "Loading..."
    });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", {
      children: ["Error ", error]
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    children: ["Authenticated as: ", (_a = auth2.user) == null ? void 0 : _a.username, /* @__PURE__ */ jsx("div", {
      children: "Existing files:"
    }), /* @__PURE__ */ jsx("div", {
      className: "flex flex-col gap-4",
      children: files.map((file) => /* @__PURE__ */ jsx("div", {
        className: "flex flex-row gap-4",
        children: /* @__PURE__ */ jsx("p", {
          children: file.name
        })
      }, file.id))
    }), /* @__PURE__ */ jsx("div", {
      children: /* @__PURE__ */ jsx("button", {
        className: "bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer",
        onClick: () => handleDelete(),
        children: "Wipe App Data"
      })
    })]
  });
};
const wipe = UNSAFE_withComponentProps(WipeApp);
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: wipe
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BTBmOm7D.js", "imports": ["/assets/chunk-EPOLDU6W-QBkHEJ6v.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-Ci6QXMta.js", "imports": ["/assets/chunk-EPOLDU6W-QBkHEJ6v.js", "/assets/puter-Cw-rezRe.js"], "css": ["/assets/root-C3hR95Uo.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-CYGic6Pt.js", "imports": ["/assets/chunk-EPOLDU6W-QBkHEJ6v.js", "/assets/Navbar-DwbOzK38.js", "/assets/puter-Cw-rezRe.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth": { "id": "routes/auth", "parentId": "root", "path": "/auth", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/auth-D_XzawOG.js", "imports": ["/assets/chunk-EPOLDU6W-QBkHEJ6v.js", "/assets/puter-Cw-rezRe.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/upload": { "id": "routes/upload", "parentId": "root", "path": "/upload", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/upload-Bq3OQiMt.js", "imports": ["/assets/chunk-EPOLDU6W-QBkHEJ6v.js", "/assets/Navbar-DwbOzK38.js", "/assets/utils-BfpOqbi7.js", "/assets/puter-Cw-rezRe.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/resume": { "id": "routes/resume", "parentId": "root", "path": "/resume/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/resume-riqMdLSR.js", "imports": ["/assets/chunk-EPOLDU6W-QBkHEJ6v.js", "/assets/puter-Cw-rezRe.js", "/assets/Navbar-DwbOzK38.js", "/assets/utils-BfpOqbi7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/wipe": { "id": "routes/wipe", "parentId": "root", "path": "/wipe", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/wipe-CAt_pPQg.js", "imports": ["/assets/chunk-EPOLDU6W-QBkHEJ6v.js", "/assets/puter-Cw-rezRe.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-7fa8a0f7.js", "version": "7fa8a0f7", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/auth": {
    id: "routes/auth",
    parentId: "root",
    path: "/auth",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/upload": {
    id: "routes/upload",
    parentId: "root",
    path: "/upload",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/resume": {
    id: "routes/resume",
    parentId: "root",
    path: "/resume/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/wipe": {
    id: "routes/wipe",
    parentId: "root",
    path: "/wipe",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
