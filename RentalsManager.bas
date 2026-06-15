Attribute VB_Name = "RentalsManager"

Sub SetupReportMode()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim cell As Range
    Dim r As Long, c As Long
    Dim colName As String
    Dim isFee As Boolean
    Dim valStr As String
    Dim regEx As Object
    
    Set ws = ActiveSheet
    
    ' 錯誤處理：防範異常導致畫面鎖死
    On Error GoTo ErrorHandler
    
    ' 關閉螢幕更新
    Application.ScreenUpdating = False
    
    ' 1. 確保新增的欄位標頭存在 (AN, AO, AP, AQ)
    If ws.Cells(1, 40).Value = "" Then ws.Cells(1, 40).Value = "開伙狀況"
    If ws.Cells(1, 41).Value = "" Then ws.Cells(1, 41).Value = "網速"
    If ws.Cells(1, 42).Value = "" Then ws.Cells(1, 42).Value = "浴缸"
    If ws.Cells(1, 43).Value = "" Then ws.Cells(1, 43).Value = "熱水器形式"
    
    ' 2. 顯示所有欄位以便重新計算
    ws.Columns.Hidden = False
    
    ' 3. 如果目前有篩選條件，先顯示所有資料以確保排序完整
    If ws.FilterMode Then ws.ShowAllData
    
    ' 偵測最後一行 (用 A 欄)
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    If lastRow < 2 Then GoTo CleanExit
    
    ' ==========================================
    ' 【合併步驟】E 欄樓層格式正則修正 (原本的 FixFloorFormat)
    ' ==========================================
    Set regEx = CreateObject("VBScript.RegExp")
    regEx.Global = True
    regEx.IgnoreCase = True
    
    For Each cell In ws.Range("E2:E" & lastRow)
        If Not IsEmpty(cell.Value) Then
            valStr = CStr(cell.Value)
            
            ' 將「數字 + 任意空格 + 樓」修正為「數字 + F」（例如：2 樓 -> 2F）
            regEx.Pattern = "(\d+)\s*樓"
            If regEx.Test(valStr) Then
                valStr = regEx.Replace(valStr, "$1F")
            End If
            
            ' 將其餘可能殘留的「樓」替換為「F」
            regEx.Pattern = "樓"
            If regEx.Test(valStr) Then
                valStr = regEx.Replace(valStr, "F")
            End If
            
            cell.Value = valStr
        End If
    Next cell
    ' ==========================================
    
    ' 4. 設定標頭列高與樣式 (121620 暗藍底 + 00F0FF 青色字)
    ws.Rows(1).RowHeight = 28
    With ws.Range(ws.Cells(1, 1), ws.Cells(1, 43))
        .Interior.Color = RGB(18, 22, 32)
        .Font.Name = "微軟正黑體"
        .Font.Size = 11
        .Font.Bold = True
        .Font.Color = RGB(0, 240, 255)
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .WrapText = True
    End With
    
    ' 5. 迴圈設定資料列的格線、對齊、格式與自適應顏色
    For r = 2 To lastRow
        ws.Rows(r).RowHeight = 20
        For c = 1 To 43
            Set cell = ws.Cells(r, c)
            
            ' 字型與格線預設值
            cell.Font.Name = "微軟正黑體"
            cell.Font.Size = 10
            cell.Font.Bold = False
            cell.Font.ColorIndex = xlAutomatic
            
            ' 斑馬線背景
            If r Mod 2 = 0 Then
                cell.Interior.Color = RGB(255, 255, 255)
            Else
                cell.Interior.Color = RGB(244, 248, 250)
            End If
            
            ' 格線
            cell.Borders.LineStyle = xlContinuous
            cell.Borders.Color = RGB(217, 223, 226)
            cell.Borders.Weight = xlThin
            
            ' 各欄對齊設定
            Select Case c
                Case 1, 5, 11, 14, 16, 19, 21, 24, 25, 26, 29, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43
                    cell.HorizontalAlignment = xlCenter
                Case 2, 7, 10, 12, 13, 17, 18, 20, 38
                    cell.HorizontalAlignment = xlLeft
                Case 3, 4, 8, 9, 15, 22, 23, 27, 28, 30
                    cell.HorizontalAlignment = xlRight
            End Select
            
            ' 格式化數字
            Select Case c
                Case 3
                    cell.NumberFormat = "$#,##0"
                Case 4
                    cell.NumberFormat = "0.0"" 坪"""
                Case 8, 9
                    cell.NumberFormat = "0.000000"
                Case 15
                    cell.NumberFormat = "#,##0"" m"""
                Case 19
                    cell.NumberFormat = "@"
            End Select
            
            ' 套用網頁附加屬性著色規則
            If Not IsEmpty(cell.Value) Then
                valStr = Trim(CStr(cell.Value))
                colName = CStr(ws.Cells(1, c).Value)
                isFee = (InStr(colName, "管理費") > 0 Or InStr(colName, "服務費") > 0)
                
                If valStr = "無" Or valStr = "不可" Or valStr = "無代收" Then
                    If isFee Then
                        cell.Interior.Color = RGB(230, 251, 247)
                        cell.Font.Color = RGB(0, 163, 136)
                        cell.Font.Bold = True
                    Else
                        cell.Interior.Color = RGB(255, 235, 240)
                        cell.Font.Color = RGB(209, 59, 83)
                        cell.Font.Bold = True
                    End If
                ElseIf valStr = "有" Or valStr = "可" Or valStr = "代收" Or valStr = "是" Then
                    If isFee Then
                        cell.Interior.Color = RGB(255, 235, 240)
                        cell.Font.Color = RGB(209, 59, 83)
                        cell.Font.Bold = True
                    Else
                        cell.Interior.Color = RGB(230, 251, 247)
                        cell.Font.Color = RGB(0, 163, 136)
                        cell.Font.Bold = True
                    End If
                ElseIf valStr = "不詳" Then
                    cell.Interior.Color = RGB(255, 243, 230)
                    cell.Font.Color = RGB(230, 138, 0)
                    cell.Font.Bold = True
                ElseIf InStr(valStr, "簽約中") > 0 Then
                    cell.Interior.Color = RGB(230, 250, 252)
                    cell.Font.Color = RGB(0, 158, 171)
                    cell.Font.Bold = True
                ElseIf InStr(valStr, "審核中") > 0 Or InStr(valStr, "審查中") > 0 Then
                    cell.Interior.Color = RGB(247, 235, 251)
                    cell.Font.Color = RGB(138, 43, 226)
                    cell.Font.Bold = True
                ElseIf InStr(valStr, "招租中") > 0 Then
                    cell.Interior.Color = RGB(230, 251, 247)
                    cell.Font.Color = RGB(0, 163, 136)
                    cell.Font.Bold = True
                End If
            End If
        Next c
    Next r
    
    ' 6. 下拉式選單資料驗證 (AN, AP, AQ)
    With ws.Range("AN2:AN" & (lastRow + 100)).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:= _
             xlBetween, Formula1:="附爐具,可開伙,電熱爐"
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
    
    With ws.Range("AP2:AP" & (lastRow + 100)).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:= _
             xlBetween, Formula1:="有,無"
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
    
    With ws.Range("AQ2:AQ" & (lastRow + 100)).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:= _
             xlBetween, Formula1:="電熱式,瓦斯,其他"
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
    
    ' 7. 自動調整欄寬與隱藏
    ws.Cells.EntireColumn.AutoFit
    ws.Range("E:E").EntireColumn.ColumnWidth = 12
    ws.Range("H:H").EntireColumn.Hidden = True
    ws.Range("I:K").EntireColumn.Hidden = True
    ws.Range("L:L").EntireColumn.Hidden = True
    ws.Range("M:M").EntireColumn.Hidden = True
    ws.Range("AK:AK").EntireColumn.Hidden = True
    
    ' AL欄設定欄寬50，自動換行，自動列高
    With ws.Range("AL:AL").EntireColumn
        .ColumnWidth = 50
        .WrapText = True
    End With
    
    ' N, O與P欄欄寬設定
    ws.Range("N:N").EntireColumn.ColumnWidth = 20
    ws.Range("O:O").EntireColumn.ColumnWidth = 10
    ws.Range("P:P").EntireColumn.ColumnWidth = 5
    
    ' T到AJ欄欄寬設定為 10
    ws.Range("T:AJ").EntireColumn.ColumnWidth = 10
    
    ws.Rows.AutoFit
    For r = 2 To lastRow
        If ws.Rows(r).RowHeight < 20 Then
            ws.Rows(r).RowHeight = 20
        End If
    Next r
    
    ' 凍結視窗 (1列與A、B、C欄)
    ws.Activate
    ws.Range("D2").Select
    ActiveWindow.FreezePanes = False
    ActiveWindow.FreezePanes = True
    
    ' 8. 排序設定 (AM欄自訂升序 -> C欄升序 -> D欄升序)
    ws.Sort.SortFields.Clear
    ws.Sort.SortFields.Add Key:=ws.Range("AM2:AM" & lastRow), _
        SortOn:=xlSortOnValues, Order:=xlAscending, _
        CustomOrder:="招租中,審核中,簽約中", DataOption:=xlSortNormal
    ws.Sort.SortFields.Add Key:=ws.Range("C2:C" & lastRow), _
        SortOn:=xlSortOnValues, Order:=xlAscending, DataOption:=xlSortNormal
    ws.Sort.SortFields.Add Key:=ws.Range("D2:D" & lastRow), _
        SortOn:=xlSortOnValues, Order:=xlAscending, DataOption:=xlSortNormal
        
    With ws.Sort
        .SetRange ws.Range("A1:AQ" & lastRow)
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
    
    
    MsgBox "版面設定與樓層格式修正完成！", vbInformation, "完成"
    
CleanExit:
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    MsgBox "執行 SetupReportMode 時發生錯誤: " & Err.Description, vbCritical, "錯誤"
    Resume CleanExit
End Sub

Sub SyncAndGenerateQuestions()
    Dim shellObj As Object
    Set shellObj = CreateObject("WScript.Shell")
    
    ' 先儲存當前工作簿，以確保 Python 讀到的是最新存檔的資料
    ActiveWorkbook.Save
    
    ' 在背景隱藏視窗執行 Python 腳本，True 代表等待執行完畢才繼續
    On Error Resume Next
    shellObj.Run "python H:\645_Home_map-center\scratch\generate_questions.py", 0, True
    
    If Err.Number <> 0 Then
        MsgBox "無法執行 Python 腳本，請確認已安裝 Python 且具備 openpyxl 模組！" & vbCrLf & "錯誤訊息: " & Err.Description, vbCritical, "錯誤"
    Else
        MsgBox "同步與提問看板生成完成！" & vbCrLf & "已成功更新：" & vbCrLf & "1. rental_questions.md (提問看板)" & vbCrLf & "2. rentals_import.csv (網頁端同步)", vbInformation, "執行成功"
    End If
    On Error GoTo 0
End Sub
