import TypeIt from "typeit-react"

const Foo = () => {
  return (
    <div className="absolute pointer-events-none top-0 left-0 w-full h-full flex justify-center items-center">
      <div className="w-64 h-64 bg-black text-white opacity-50 flex justify-center items-center p-4">
        <TypeIt
          getBeforeInit={(instance) => {
            return instance
              .type("Welcome to the WikiHouse configurator.")
              .pause(750) // Adjust the pause duration in milliseconds
              .break() // Adds a line break for the new paragraph
              .break() // Optional: Add another line break if you need more space between paragraphs
              .type("What kind of WikiHouse would you like to start with?")
          }}
          options={{
            speed: 50, // Adjust the typing speed (lower value is faster)
          }}
        />
      </div>
    </div>
  )
}

export default Foo
