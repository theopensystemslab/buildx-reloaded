import React, { useState } from "react";
import type { ReactNode, FC } from "react";

export interface Props {
  icon: FC<any>;
  children?: ReactNode;
}

export default function IconMenu(props: Props) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="inline-block w-12 h-12"
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      <button className="inline-block w-full h-full transition-colors duration-200 ease-in-out focus:outline-none focus:shadow-[0 0 0 3px rgba(0,0,0,0.2))]">
        <props.icon />
      </button>
      {hovered && (
        <div className="absolute top-0 z-20 bg-white w-40 left-full">
          {props.children}
        </div>
      )}
    </div>
  );
}
