import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  TableSortLabel,
  TextField,
  InputAdornment
} from '@mui/material';
import { Schedule, ScheduleEntry } from '../../store/slices/scheduleSlice';
import { formatDateWithDayOfWeek } from '../../utils/dateUtils';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';

interface ScheduleListProps {
  schedule: Schedule;
}

type Order = 'asc' | 'desc';

const ScheduleList: React.FC<ScheduleListProps> = ({ schedule }) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof ScheduleEntry>('scheduleDate');
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSort = (property: keyof ScheduleEntry) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const sortedScheduleEntries = [...schedule.entries].sort((a, b) => {
    let valueA: any = a[orderBy];
    let valueB: any = b[orderBy];
    
    // Handle null values for sorting
    if (valueA === null) return order === 'asc' ? -1 : 1;
    if (valueB === null) return order === 'asc' ? 1 : -1;
    
    // Date sorting
    if (orderBy === 'scheduleDate') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }
    
    // String or number comparison
    if (valueA < valueB) {
      return order === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  // Filter entries based on search term
  const filteredEntries = sortedScheduleEntries.filter(entry => {
    // If no search term, return all entries
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const date = new Date(entry.scheduleDate);
    const dateStr = formatDateWithDayOfWeek(date).toLowerCase();
    const dayOfWeek = entry.dayOfWeek.toLowerCase();
    
    return (
      dateStr.includes(searchLower) ||
      dayOfWeek.includes(searchLower) ||
      (entry.startTime?.toLowerCase().includes(searchLower)) ||
      (entry.endTime?.toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Schedule List View
        </Typography>
        
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'scheduleDate'}
                  direction={orderBy === 'scheduleDate' ? order : 'asc'}
                  onClick={() => handleSort('scheduleDate')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'dayOfWeek'}
                  direction={orderBy === 'dayOfWeek' ? order : 'asc'}
                  onClick={() => handleSort('dayOfWeek')}
                >
                  Day of Week
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'startTime'}
                  direction={orderBy === 'startTime' ? order : 'asc'}
                  onClick={() => handleSort('startTime')}
                >
                  Start Time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'endTime'}
                  direction={orderBy === 'endTime' ? order : 'asc'}
                  onClick={() => handleSort('endTime')}
                >
                  End Time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'shiftDurationHours'}
                  direction={orderBy === 'shiftDurationHours' ? order : 'asc'}
                  onClick={() => handleSort('shiftDurationHours')}
                >
                  Hours
                </TableSortLabel>
              </TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntries.map((entry) => {
              const date = new Date(entry.scheduleDate);
              return (
                <TableRow 
                  key={entry.id}
                  sx={{ 
                    backgroundColor: entry.isDayOff ? 'rgba(0, 0, 0, 0.02)' : undefined,
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <TableCell>
                    {date.toLocaleDateString()}
                  </TableCell>
                  <TableCell>{entry.dayOfWeek}</TableCell>
                  <TableCell>
                    {entry.isDayOff ? '—' : entry.startTime}
                  </TableCell>
                  <TableCell>
                    {entry.isDayOff ? '—' : entry.endTime}
                  </TableCell>
                  <TableCell>
                    {entry.isDayOff ? '0' : entry.shiftDurationHours}
                  </TableCell>
                  <TableCell>
                    {entry.isDayOff ? (
                      <Chip 
                        label="Day Off" 
                        size="small" 
                        variant="outlined"
                        color="default"
                      />
                    ) : entry.isFixedShift ? (
                      <Chip 
                        icon={<LockIcon fontSize="small" />}
                        label="Fixed" 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                      />
                    ) : (
                      <Chip 
                        label="Flexible" 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No schedule entries found for your search criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="body2" color="textSecondary">
          Showing {filteredEntries.length} of {schedule.entries.length} shifts
        </Typography>
      </Box>
    </Box>
  );
};

export default ScheduleList;