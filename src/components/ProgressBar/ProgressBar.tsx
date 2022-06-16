const ProgressBar = ({ bgcolor = "white", progress = 50, height = "16px" }) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          height: height,
          width: "100%",
          backgroundColor: "#2D2E33",
          borderRadius: 40,
          border: "1px solid white",
        }}
      >
        <div
          style={{
            height: "14px",
            width: `${25}%`,
            backgroundColor: bgcolor,
            borderRadius: 40,
            textAlign: "right",
            padding: "2px",
          }}
        />
      </div>
    </>
  );
};

export default ProgressBar;
