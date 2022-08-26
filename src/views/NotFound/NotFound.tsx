interface Props {
  custom404Message?: string;
}
const NotFound: React.FC<Props> = () => {
  return (
    <div>
      <h1>Not Found</h1>
    </div>
  );
};

export default NotFound;
