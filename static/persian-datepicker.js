// Persian Date Picker for Basalam Portal
class PersianDatePicker {
  constructor() {
    this.monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    this.today = this.getCurrentPersianDate();
  }

  // Get current Persian date
  getCurrentPersianDate() {
    const now = new Date();
    return this.gregorianToPersian(now);
  }

  // Convert Gregorian to Persian
  gregorianToPersian(gDate) {
    const gYear = gDate.getFullYear();
    const gMonth = gDate.getMonth() + 1;
    const gDay = gDate.getDate();

    let jYear, jMonth, jDay;

    // Simple conversion algorithm
    const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if ((gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0) {
      gDaysInMonth[1] = 29; // Leap year
    }

    // Calculate total days since Gregorian epoch
    let totalDays = 0;
    for (let y = 1; y < gYear; y++) {
      totalDays += ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;
    }
    for (let m = 0; m < gMonth - 1; m++) {
      totalDays += gDaysInMonth[m];
    }
    totalDays += gDay;

    // Persian calendar starts from March 22, 622 CE
    const persianEpoch = 226899; // Days from Jan 1, 1 CE to March 22, 622 CE
    const persianDays = totalDays - persianEpoch;

    // Calculate Persian year
    jYear = Math.floor(persianDays / 365.2422) + 1;
    
    // Adjust for Persian calendar specifics
    const yearStart = (jYear - 1) * 365 + Math.floor((jYear - 1) / 33) * 8 + Math.floor(((jYear - 1) % 33 + 3) / 4);
    const dayOfYear = persianDays - yearStart;

    // Calculate month and day
    if (dayOfYear <= 186) {
      jMonth = Math.ceil(dayOfYear / 31);
      jDay = dayOfYear - (jMonth - 1) * 31;
    } else {
      jMonth = Math.ceil((dayOfYear - 186) / 30) + 6;
      jDay = dayOfYear - 186 - (jMonth - 7) * 30;
    }

    // Adjust for current year approximation
    const currentYear = 1403; // Approximate current Persian year
    const yearDiff = currentYear - jYear;
    jYear = currentYear;

    return { year: jYear, month: jMonth, day: jDay };
  }

  // Convert Persian to Gregorian
  persianToGregorian(pYear, pMonth, pDay) {
    // Approximate conversion - good enough for form validation
    let gYear = pYear + 621;
    let gMonth = pMonth;
    let gDay = pDay;

    // Rough adjustment for seasonal differences
    if (pMonth <= 6) {
      gMonth = pMonth + 3;
      if (gMonth > 12) {
        gMonth -= 12;
        gYear += 1;
      }
    } else {
      gMonth = pMonth - 6;
      gYear += 1;
    }

    // Adjust day for month length differences
    if (gMonth === 2 && gDay > 28) gDay = 28;
    if ([4, 6, 9, 11].includes(gMonth) && gDay > 30) gDay = 30;

    return new Date(gYear, gMonth - 1, gDay);
  }

  // Format date as YYYY/MM/DD
  formatDate(date) {
    const year = date.year.toString();
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  // Parse date string
  parseDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);

    if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return { year, month, day };
  }

  // Create date picker for an input
  createDatePicker(inputElement) {
    const container = document.createElement('div');
    container.className = 'persian-datepicker-container';
    container.style.cssText = 'position: relative; display: inline-block; width: 100%;';

    // Style the input
    inputElement.style.cssText += 'cursor: pointer; background: white;';
    inputElement.setAttribute('readonly', 'true');
    inputElement.placeholder = 'انتخاب تاریخ...';

    // Create calendar icon
    const icon = document.createElement('span');
    icon.innerHTML = '📅';
    icon.style.cssText = 'position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--muted);';

    // Wrap input
    inputElement.parentNode.insertBefore(container, inputElement);
    container.appendChild(inputElement);
    container.appendChild(icon);

    // Add click handler
    inputElement.addEventListener('click', (e) => {
      e.preventDefault();
      this.showDatePicker(inputElement, container);
    });

    return container;
  }

  // Show date picker modal
  showDatePicker(inputElement, container) {
    // Remove existing picker
    const existingPicker = document.querySelector('.persian-datepicker-modal');
    if (existingPicker) existingPicker.remove();

    // Get current value
    let currentDate = this.today;
    if (inputElement.value) {
      const parsed = this.parseDate(inputElement.value);
      if (parsed) currentDate = parsed;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'persian-datepicker-modal overlay';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';

    const picker = document.createElement('div');
    picker.className = 'modal';
    picker.style.cssText = 'width: 350px; background: white; border-radius: 12px; box-shadow: 0 20px 25px rgba(0,0,0,0.3);';

    picker.innerHTML = `
      <div class="modal-head" style="padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: var(--brand);">📅 انتخاب تاریخ</h3>
        <button class="close-picker" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--muted);">×</button>
      </div>
      <div class="modal-body" style="padding: 1rem;">
        <div class="date-controls" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <button class="prev-month btn ghost" style="padding: 0.5rem;">‹</button>
          <div class="current-month" style="font-weight: 600; color: var(--brand);">
            ${this.monthNames[currentDate.month - 1]} ${currentDate.year}
          </div>
          <button class="next-month btn ghost" style="padding: 0.5rem;">›</button>
        </div>
        <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center;"></div>
        <div class="quick-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button class="today-btn btn ghost" style="flex: 1;">امروز</button>
          <button class="clear-btn btn ghost" style="flex: 1;">پاک کردن</button>
        </div>
      </div>
      <div class="modal-foot" style="padding: 1rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="cancel-btn btn ghost">انصراف</button>
        <button class="confirm-btn btn" style="background: var(--brand);">تأیید</button>
      </div>
    `;

    modal.appendChild(picker);
    document.body.appendChild(modal);

    // Render calendar
    this.renderCalendar(picker, currentDate);

    // Add event listeners
    let selectedDate = currentDate;

    picker.querySelector('.close-picker').onclick = () => modal.remove();
    picker.querySelector('.cancel-btn').onclick = () => modal.remove();
    
    picker.querySelector('.today-btn').onclick = () => {
      selectedDate = this.today;
      this.renderCalendar(picker, selectedDate);
    };

    picker.querySelector('.clear-btn').onclick = () => {
      inputElement.value = '';
      this.updateHiddenInput(inputElement, null);
      modal.remove();
    };

    picker.querySelector('.confirm-btn').onclick = () => {
      inputElement.value = this.formatDate(selectedDate);
      this.updateHiddenInput(inputElement, selectedDate);
      modal.remove();
    };

    picker.querySelector('.prev-month').onclick = () => {
      selectedDate = this.adjustMonth(selectedDate, -1);
      this.renderCalendar(picker, selectedDate);
    };

    picker.querySelector('.next-month').onclick = () => {
      selectedDate = this.adjustMonth(selectedDate, 1);
      this.renderCalendar(picker, selectedDate);
    };

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // Render calendar grid
  renderCalendar(picker, date) {
    const grid = picker.querySelector('.calendar-grid');
    const monthHeader = picker.querySelector('.current-month');
    
    monthHeader.textContent = `${this.monthNames[date.month - 1]} ${date.year}`;
    
    // Clear grid
    grid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    dayHeaders.forEach(header => {
      const cell = document.createElement('div');
      cell.textContent = header;
      cell.style.cssText = 'padding: 0.5rem; font-weight: 600; color: var(--muted); font-size: 0.8rem;';
      grid.appendChild(cell);
    });

    // Get days in month
    const daysInMonth = date.month <= 6 ? 31 : (date.month <= 11 ? 30 : 29);
    
    // Add empty cells for start of month (approximate)
    const startDay = (date.year + date.month) % 7;
    for (let i = 0; i < startDay; i++) {
      const cell = document.createElement('div');
      grid.appendChild(cell);
    }

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.textContent = day;
      cell.style.cssText = 'padding: 0.5rem; cursor: pointer; border-radius: 4px; transition: all 0.2s;';
      
      if (day === date.day) {
        cell.style.cssText += 'background: var(--brand); color: white;';
      } else {
        cell.style.cssText += 'hover: background: var(--card-hover);';
        cell.onmouseover = () => cell.style.background = 'var(--card-hover)';
        cell.onmouseout = () => cell.style.background = '';
      }

      cell.onclick = () => {
        // Remove previous selection
        grid.querySelectorAll('div').forEach(d => {
          if (d.style.background === 'var(--brand)' || d.style.backgroundColor.includes('rgb')) {
            d.style.background = '';
            d.style.color = '';
          }
        });
        
        // Select new day
        cell.style.background = 'var(--brand)';
        cell.style.color = 'white';
        date.day = day;
      };

      grid.appendChild(cell);
    }
  }

  // Adjust month
  adjustMonth(date, delta) {
    let newMonth = date.month + delta;
    let newYear = date.year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    return { year: newYear, month: newMonth, day: date.day };
  }

  // Update hidden input for form submission
  updateHiddenInput(inputElement, persianDate) {
    const hiddenInput = inputElement.parentNode.querySelector('input[type="hidden"]') || 
                       document.querySelector(`input[name="${inputElement.name.replace('_persian', '')}"]`);
    
    if (hiddenInput && persianDate) {
      const gregorianDate = this.persianToGregorian(persianDate.year, persianDate.month, persianDate.day);
      hiddenInput.value = gregorianDate.toISOString().split('T')[0];
    } else if (hiddenInput) {
      hiddenInput.value = '';
    }
  }
}

// Auto-initialize Persian date pickers
document.addEventListener('DOMContentLoaded', () => {
  const datePicker = new PersianDatePicker();
  
  // Find all Persian date inputs
  document.querySelectorAll('.persian-date').forEach(input => {
    datePicker.createDatePicker(input);
  });
});