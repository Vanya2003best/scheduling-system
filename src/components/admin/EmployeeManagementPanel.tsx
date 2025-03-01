import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchEmployees,
  selectEmployees,
  selectAdminLoading,
  Employee
} from '../../store/slices/adminSlice';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  TableSortLabel,
  TablePagination
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof Employee | 'actions';
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'id', label: 'ID', numeric: true, sortable: true },
  { id: 'firstName', label: 'First Name', numeric: false, sortable: true },
  { id: 'lastName', label: 'Last Name', numeric: false, sortable: true },
  { id: 'email', label: 'Email', numeric: false, sortable: true },
  { id: 'position', label: 'Position', numeric: false, sortable: true },
  { id: 'department', label: 'Department', numeric: false, sortable: true },
  { id: 'hireDate', label: 'Hire Date', numeric: false, sortable: true },
  { id: 'actions', label: 'Actions', numeric: false, sortable: false },
];

// Placeholder function that would be replaced with actual API call
const getEmployeeInitials = (employee: Employee): string => {
  return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;
};

const EmployeeManagementPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const employees = useSelector(selectEmployees);
  const isLoading = useSelector(selectAdminLoading);
  
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Employee>('id');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialogs
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [deleteEmployeeOpen, setDeleteEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // New employee form
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
    hireDate: new Date().toISOString().split('T')[0]
  });
  
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);
  
  const handleSort = (property: keyof Employee) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when search changes
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenAddEmployee = () => {
    setAddEmployeeOpen(true);
  };
  
  const handleCloseAddEmployee = () => {
    setAddEmployeeOpen(false);
    setNewEmployee({
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      department: '',
      hireDate: new Date().toISOString().split('T')[0]
    });
  };
  
  const handleOpenEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditEmployeeOpen(true);
  };
  
  const handleCloseEditEmployee = () => {
    setEditEmployeeOpen(false);
    setSelectedEmployee(null);
  };
  
  const handleOpenDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteEmployeeOpen(true);
  };
  
  const handleCloseDeleteEmployee = () => {
    setDeleteEmployeeOpen(false);
    setSelectedEmployee(null);
  };
  
  const handleNewEmployeeChange = (field: string, value: string) => {
    setNewEmployee(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAddEmployee = () => {
    // This would be replaced with an actual API call
    console.log('Adding employee:', newEmployee);
    handleCloseAddEmployee();
  };
  
  const handleEditEmployee = () => {
    // This would be replaced with an actual API call
    console.log('Editing employee:', selectedEmployee);
    handleCloseEditEmployee();
  };
  
  const handleDeleteEmployee = () => {
    // This would be replaced with an actual API call
    console.log('Deleting employee:', selectedEmployee);
    handleCloseDeleteEmployee();
  };
  
  // Filter and sort employees
  const filteredEmployees = employees.filter((employee) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      employee.position.toLowerCase().includes(searchLower) ||
      employee.department.toLowerCase().includes(searchLower)
    );
  });
  
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const valueA = a[orderBy];
    const valueB = b[orderBy];
    
    if (valueA < valueB) {
      return order === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  // Pagination
  const paginatedEmployees = sortedEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Employee Management
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddEmployee}
          disabled={isLoading}
        >
          Add Employee
        </Button>
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Manage employee information and accounts. Employees can log in to the system to submit their scheduling preferences.
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search employees..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  {headCell.sortable ? (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleSort(headCell.id as keyof Employee)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell align="right">{employee.id}</TableCell>
                <TableCell>{employee.firstName}</TableCell>
                <TableCell>{employee.lastName}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{new Date(employee.hireDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEditEmployee(employee)}
                    disabled={isLoading}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteEmployee(employee)}
                    disabled={isLoading}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paginatedEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    {filteredEmployees.length === 0 ? 'No employees found matching your search.' : 'No employees found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeOpen} onClose={handleCloseAddEmployee} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                value={newEmployee.firstName}
                onChange={(e) => handleNewEmployeeChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={newEmployee.lastName}
                onChange={(e) => handleNewEmployeeChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={newEmployee.email}
                onChange={(e) => handleNewEmployeeChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Position"
                fullWidth
                value={newEmployee.position}
                onChange={(e) => handleNewEmployeeChange('position', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                fullWidth
                value={newEmployee.department}
                onChange={(e) => handleNewEmployeeChange('department', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Hire Date"
                type="date"
                fullWidth
                value={newEmployee.hireDate}
                onChange={(e) => handleNewEmployeeChange('hireDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddEmployee}>Cancel</Button>
          <Button 
            onClick={handleAddEmployee} 
            variant="contained" 
            color="primary"
            disabled={
              !newEmployee.firstName || 
              !newEmployee.lastName || 
              !newEmployee.email || 
              !newEmployee.position || 
              !newEmployee.department || 
              !newEmployee.hireDate
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Employee Dialog */}
      <Dialog open={editEmployeeOpen} onClose={handleCloseEditEmployee} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={selectedEmployee.firstName}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={selectedEmployee.lastName}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={selectedEmployee.email}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Position"
                  fullWidth
                  value={selectedEmployee.position}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department"
                  fullWidth
                  value={selectedEmployee.department}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Hire Date"
                  type="date"
                  fullWidth
                  value={selectedEmployee.hireDate.split('T')[0]}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, hireDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditEmployee}>Cancel</Button>
          <Button 
            onClick={handleEditEmployee} 
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Employee Dialog */}
      <Dialog open={deleteEmployeeOpen} onClose={handleCloseDeleteEmployee}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Typography>
              Are you sure you want to delete employee {selectedEmployee.firstName} {selectedEmployee.lastName}?
              This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteEmployee}>Cancel</Button>
          <Button 
            onClick={handleDeleteEmployee} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeManagementPanel;