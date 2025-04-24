module.exports = {
    content: [
      './src/**/*.{js,ts,jsx,tsx}', // Adjust this path to match your project structure
    ],
    theme: {
      extend: {
        boxShadow: {
          'legionen': '0 4px 20px -4px rgba(255,0,64,0.6)',
          'skurkeriet': '0 4px 20px -4px rgba(255,221,0,0.6)',
        },
      },
    },
  };