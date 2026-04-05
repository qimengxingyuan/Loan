import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = '选择日期',
  min,
  max,
  required = false,
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 当value变化时，更新viewDate
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, [value]);

  // 格式化日期显示（一行显示）
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder;
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // 获取月份天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 获取月份第一天是星期几
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // 上个月的日期
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      });
    }

    // 当前月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }

    // 下个月的日期
    const remainingDays = 42 - days.length; // 6行 x 7列
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      });
    }

    return days;
  };

  // 生成年份列表（前后50年）
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      years.push(i);
    }
    return years;
  };

  // 检查日期是否可选
  const isDateSelectable = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (min && dateStr < min) return false;
    if (max && dateStr > max) return false;
    return true;
  };

  // 检查日期是否被选中
  const isDateSelected = (year: number, month: number, day: number) => {
    if (!value) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === value;
  };

  // 选择日期
  const handleSelectDate = (year: number, month: number, day: number) => {
    if (!isDateSelectable(year, month, day)) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    // 不直接关闭，等待用户点击"确定"
  };

  // 选择年份
  const handleSelectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setShowYearPicker(false);
  };

  // 切换到上个月
  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // 切换到下个月
  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // 切换到当前月
  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    const dateStr = today.toISOString().split('T')[0];
    if (isDateSelectable(today.getFullYear(), today.getMonth(), today.getDate())) {
      onChange(dateStr);
    }
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const calendarDays = generateCalendarDays();
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const years = generateYears();

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 显示区域 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-3 bg-[var(--background)] rounded-2xl text-left transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center">
            <Calendar size={16} className="text-[var(--accent)]" />
          </div>
          <span className={`text-caption-medium ${value ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
            {formatDisplayDate(value)}
          </span>
        </div>
        <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
      </button>

      {/* 日期选择弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              style={{ maxWidth: '414px', margin: '0 auto' }}
              onClick={() => {
                setIsOpen(false);
                setShowYearPicker(false);
              }}
            />

            {/* 弹窗内容 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] bg-white rounded-t-3xl"
              style={{ maxWidth: '414px', margin: '0 auto' }}
            >
              {/* 拖动指示器 */}
              <div className="flex items-center justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
              </div>

              {/* 头部 */}
              <div className="px-4 pb-3 border-b border-[var(--border)] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowYearPicker(false);
                  }}
                  className="p-2 -ml-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={20} />
                </button>
                <h2 className="text-title-3 font-semibold text-[var(--text-primary)]">
                  选择日期
                </h2>
                <button
                  type="button"
                  onClick={goToToday}
                  className="text-caption-medium text-[var(--accent)] px-2 py-1"
                >
                  今天
                </button>
              </div>

              {/* 月份导航 */}
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="p-2 rounded-xl bg-[var(--background)] text-[var(--text-secondary)] active:scale-95 transition-transform"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowYearPicker(!showYearPicker)}
                  className="text-title-3 font-semibold text-[var(--text-primary)] px-4 py-2 rounded-xl hover:bg-[var(--background)] transition-colors"
                >
                  {viewDate.getFullYear()}年 {monthNames[viewDate.getMonth()]}
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-2 rounded-xl bg-[var(--background)] text-[var(--text-secondary)] active:scale-95 transition-transform"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* 年份选择器 */}
              <AnimatePresence>
                {showYearPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 200, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-b border-[var(--border)]"
                  >
                    <div className="h-full overflow-y-auto p-4">
                      <div className="grid grid-cols-5 gap-2">
                        {years.map((year) => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => handleSelectYear(year)}
                            className={`
                              py-2 px-1 rounded-lg text-caption-medium transition-all
                              ${year === viewDate.getFullYear() 
                                ? 'bg-[var(--accent)] text-white' 
                                : 'text-[var(--text-primary)] hover:bg-[var(--background)]'
                              }
                            `}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 px-4 mb-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-caption-small text-[var(--text-tertiary)] py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 日历网格 */}
              <div className="grid grid-cols-7 px-4 pb-3 gap-1">
                {calendarDays.map((dayInfo, index) => {
                  const isSelectable = isDateSelectable(dayInfo.year, dayInfo.month, dayInfo.day);
                  const isSelected = isDateSelected(dayInfo.year, dayInfo.month, dayInfo.day);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectDate(dayInfo.year, dayInfo.month, dayInfo.day)}
                      disabled={!isSelectable}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-caption-medium
                        transition-all active:scale-95
                        ${!dayInfo.isCurrentMonth ? 'text-[var(--text-tertiary)]/50' : 'text-[var(--text-primary)]'}
                        ${isSelected ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30' : ''}
                        ${!isSelected && dayInfo.isCurrentMonth && isSelectable ? 'hover:bg-[var(--accent)]/10' : ''}
                        ${!isSelectable ? 'opacity-30 cursor-not-allowed' : ''}
                      `}
                    >
                      {dayInfo.day}
                    </button>
                  );
                })}
              </div>

              {/* 底部按钮 */}
              <div className="p-4 pb-8 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowYearPicker(false);
                  }}
                  className="w-full py-3.5 bg-[var(--accent)] text-white rounded-2xl text-body-medium font-semibold active:scale-[0.98] transition-transform"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 隐藏的原生input用于表单验证 */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
      />
    </div>
  );
}
