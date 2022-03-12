import { Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { StyledSidebar } from "./Sidebar.styles";
const Sidebar = () => {
  return (
    <StyledSidebar>
      <Menu iconShape="square">
        <MenuItem>Dashboard</MenuItem>
        <SubMenu title="Components">
          <MenuItem>Component 1</MenuItem>
          <MenuItem>Component 2</MenuItem>
        </SubMenu>
      </Menu>
    </StyledSidebar>
  );
};

export default Sidebar;
