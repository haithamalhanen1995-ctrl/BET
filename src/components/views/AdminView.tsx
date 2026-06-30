<button
  onClick={async () => {
    const user = users.find(u => u.id === manualWithdrawUserId);
    if (!user) return;
...........
الكود الثاني في صورة


<button
  onClick={async () => {
    alert("جاري الحفظ...");
    const user = users.find(u => u.id === manualWithdrawUserId);
    if (!user) {
      alert("المستخدم غير موجود! ID: " + manualWithdrawUserId);
      return;
    }
    const amount = parseFloat(manualWithdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === "ar" ? "يرجى إدخال مبلغ صحيح!" : "Please enter a valid amount!");
      return;
    }
    const createdAt = manualWithdrawDate ? new Date(manualWithdrawDate).toISOString() : new Date().toISOString();
    await adminAddManualWithdrawal(user.id, user.username, user.phone, amount, manualWithdrawAddress, manualWithdrawStatus, createdAt);
    setManualWithdrawUserId(null);
    setManualWithdrawAmount("");
    setManualWithdrawAddress("");
    alert(language === "ar" ? "تمت إضافة السحب بنجاح!" : "Withdrawal added successfully!");
  }}
