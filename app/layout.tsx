import clsx from "clsx";
import { Inter } from "next/font/google";
import { PropsWithChildren } from "react";
import "~/styles/globals.css";
import Footer from "./ui/Footer";
import Nav from "./ui/Nav";
import Fathom from "./Fathom";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <html lang="en" className={clsx(inter.className, "w-full h-full")}>
      <body className="w-full h-full flex flex-col overflow-hidden">
        <Fathom />
        <div className="flex-1 flex-grow-0">
          <Nav />
        </div>
        <div className="flex-auto overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <div className="flex-1 flex-grow-0">
          <Footer />
        </div>
      </body>
    </html>
  );
};

export default Layout;
