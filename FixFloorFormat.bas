Attribute VB_Name = "FixFloorModule"

Sub FixFloorFormat()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim cell As Range
    Dim regEx As Object
    
    Set ws = ActiveSheet
    
    ' 錯誤處理
    On Error GoTo ErrorHandler
    
    ' 取消螢幕更新以提高執行速度
    Application.ScreenUpdating = False
    
    ' 使用 A 欄（ID）精確尋找資料最後一行
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    If lastRow < 2 Then
        MsgBox "未找到有效的資料列！", vbExclamation, "提示"
        Exit Sub
    End If
    
    ' 建立正則表達式物件
    Set regEx = CreateObject("VBScript.RegExp")
    regEx.Global = True
    regEx.IgnoreCase = True
    
    ' 迴圈處理 E 欄 (從第 2 行到最後一行)
    For Each cell In ws.Range("E2:E" & lastRow)
        If Not IsEmpty(cell.Value) Then
            Dim val As String
            val = CStr(cell.Value)
            
            ' 步驟 1: 將「數字 + 任意空格 + 樓」修正為「數字 + F」（例如：2 樓 -> 2F）
            regEx.Pattern = "(\d+)\s*樓"
            If regEx.Test(val) Then
                val = regEx.Replace(val, "$1F")
            End If
            
            ' 步驟 2: 將其餘可能殘留的「樓」替換為「F」
            regEx.Pattern = "樓"
            If regEx.Test(val) Then
                val = regEx.Replace(val, "F")
            End If
            
            ' 寫回儲存格
            cell.Value = val
        End If
    Next cell
    
    MsgBox "E 欄樓層格式修正完成！", vbInformation, "完成"
    
CleanExit:
    ' 恢復螢幕更新
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    MsgBox "執行格式修正時發生錯誤: " & Err.Description, vbCritical, "錯誤"
    Resume CleanExit
End Sub
