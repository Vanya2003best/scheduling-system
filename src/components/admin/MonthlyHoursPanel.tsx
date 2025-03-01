import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  updateMonthlyHours,
  MonthlyHours,
  selectAdminLoading
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { MONTH_NAMES } from '../../utils/constants';

interface MonthlyHoursPanelProps {
  monthlyHours: MonthlyHours[];
}

const MonthlyHoursPanel: React.FC<MonthlyHoursPanelProps> = ({ monthlyHours }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectAdminLoading);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyHours | null>(null);
  const [newTargetHours, setNewTargetHours] = useState<number>(0);
  
  // For adding new month/year
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(1);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newHours, setNewHours] = useState<number>(160);
  
  const handleOpenEditDialog = (month: MonthlyHours) => {
    setSelectedMonth(month);
    setNewTargetHours(month.targetHours);
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedMonth(null);
  };
  
  const handleOpenAddDialog = () => {
    setNewMonth(1);
    setNewYear(new Date().getFullYear());
    setNewHours(160);
    setAddDialogOpen(true);
  };
  
  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };
  
  const handleUpdateMonthlyHours = () => {
    if (selectedMonth && newTargetHours > 0) {
      dispatch(updateMonthlyHours({
        year: selectedMonth.year,
        monthNumber: selectedMonth.monthNumber,
        targetHours: newTargetHours
      }));
      handleCloseEditDialog();
    }
  };
  
  const handleAddMonthlyHours = () => {
    if (newMonth && newYear && newHours > 0) {
      dispatch(updateMonthlyHours({
        year: newYear,
        monthNumber: newMonth,
        targetHours: newHours
      }));
      handleCloseAddDialog();
    }
  };
  
  // Group monthly hours by year for easier viewing
  const hoursByYear: Record<number, MonthlyHours[]> = {};
  monthlyHours.forEach(month => {
    if (!hoursByYear[month.year]) {
      hoursByYear[month.year] = [];
    }
    hoursByYear[month.year].push(month);
  });
  
  // Sort years in descending order
  const sortedYears = Object.keys(hoursByYear).map(Number).sort((a, b) => b - a);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Monthly Working Hours
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenAddDialog}
          disabled={isLoading}
        >
          Add New Month
        </Button>
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Set the target working hours for each month. These values will be used by the scheduling algorithm to ensure each employee's schedule meets the monthly hour requirement.
      </Typography>
      
      {sortedYears.map(year => (
        <Box key={year} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Year: {year}
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Target Hours</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hoursByYear[year]
                  .sort((a, b) => a.monthNumber - b.monthNumber)
                  .map(month => (
                    <TableRow key={`${month.year}-${month.monthNumber}`}>
                      <TableCell>{month.monthName}</TableCell>
                      <TableCell align="right">{month.targetHours}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenEditDialog(month)}
                          disabled={isLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>
          Edit Monthly Hours
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedMonth?.monthName} {selectedMonth?.year}
            </Typography>
            
            <TextField
              label="Target Hours"
              type="number"
              fullWidth
              value={newTargetHours}
              onChange={(e) => setNewTargetHours(parseInt(e.target.value))}
              inputProps={{ min: 1 }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateMonthlyHours} 
            variant="contained" 
            color="primary"
            disabled={!newTargetHours || newTargetHours <= 0 || isLoading}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog}>
        <DialogTitle>
          Add New Month
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel id="month-select-label">Month</InputLabel>
                  <Select
                    labelId="month-select-label"
                    value={newMonth}
                    label="Month"
                    onChange={(e) => setNewMonth(e.target.value as number)}
                  >
                    {MONTH_NAMES.map((month, index) => (
                      <MenuItem key={index} value={index + 1}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Year"
                  type="number"
                  fullWidth
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value))}
                  inputProps={{ min: 2000, max: 2100 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Target Hours"
                  type="number"
                  fullWidth
                  value={newHours}
                  onChange={(e) => setNewHours(parseInt(e.target.value))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button 
            onClick={handleAddMonthlyHours} 
            variant="contained" 
            color="primary"
            disabled={!newMonth || !newYear || !newHours || newHours <= 0 || isLoading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonthlyHoursPanel;