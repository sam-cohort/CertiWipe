using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public record Drive(string DevicePath, string MountPath, long Size);

public class Program
{
    private static readonly HttpClient client = new HttpClient();

    public static async Task Main(string[] args)
    {
        Console.WriteLine("--- CertiWipe Linux Secure Wipe ---");
        var removableDrives = FindRemovableDrivesOnLinux();

        if (removableDrives.Count == 0)
        {
            Console.WriteLine("No removable drives found.");
            return;
        }

        Console.WriteLine("\nPlease select a drive to WIPE:");
        for (int i = 0; i < removableDrives.Count; i++)
        {
            Console.WriteLine($"  [{i}] {removableDrives[i].DevicePath} ({removableDrives[i].MountPath}) - {removableDrives[i].Size / 1_000_000_000} GB");
        }

        Console.Write("\nEnter the number of the drive to WIPE: ");
        if (!int.TryParse(Console.ReadLine(), out int choice) || choice < 0 || choice >= removableDrives.Count)
        {
            Console.WriteLine("Invalid selection. Aborting.");
            return;
        }
        Drive selectedDrive = removableDrives[choice];

        Console.WriteLine($"\nWARNING! You are about to permanently erase ALL DATA on {selectedDrive.DevicePath}.");
        Console.Write("Type 'ERASE' in all caps to confirm: ");
        if (Console.ReadLine() != "ERASE")
        {
            Console.WriteLine("Confirmation not received. Aborting.");
            return;
        }

        bool wipeSuccess = WipeDevice(selectedDrive);

        if (wipeSuccess)
        {
            Console.WriteLine("\nWipe successful. Now creating certificate...");
            await CreateCertificate(selectedDrive);
        }
    }

    public static bool WipeDevice(Drive device)
    {
        Console.WriteLine($"\nStarting secure wipe on {device.DevicePath}... Please wait.");
        try
        {
            long totalBytes = device.Size;
            long bytesWritten = 0;
            byte[] buffer = new byte[1024 * 1024];

            using (FileStream driveStream = new FileStream(device.DevicePath, FileMode.Open, FileAccess.Write))
            {
                while (bytesWritten < totalBytes)
                {
                    long remainingBytes = totalBytes - bytesWritten;
                    int bytesToWrite = (int)Math.Min(buffer.Length, remainingBytes);
                    driveStream.Write(buffer, 0, bytesToWrite);
                    bytesWritten += bytesToWrite;
                    double percentage = ((double)bytesWritten / totalBytes) * 100;
                    Console.Write($"\rWiping... {percentage:F2}% complete.");
                }
            }
            Console.WriteLine("\n\nSecure wipe completed successfully!");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\nAn error occurred during the wipe process: {ex.Message}");
            return false;
        }
    }

    public static async Task CreateCertificate(Drive wipedDrive)
    {
        try
        {
            var wipeData = new
            {
                drivePath = wipedDrive.DevicePath,
                driveSize = wipedDrive.Size,
                wipeMethod = "NIST 800-88 Clear (Single-Pass Overwrite)",
                wipeDate = DateTime.UtcNow.ToString("o")
            };
            
            var postData = new { wipeData = wipeData };
            string jsonPayload = JsonSerializer.Serialize(postData);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await client.PostAsync("http://localhost:3000/create", content);

            if (response.IsSuccessStatusCode)
            {
                string responseBody = await response.Content.ReadAsStringAsync();
                
                // Save the file to the application's local directory
                string savePath = AppContext.BaseDirectory;
                string wipeId = JsonDocument.Parse(responseBody).RootElement.GetProperty("wipeId").GetString() ?? "unknown";
                string fileName = $"CertiWipe_Certificate_{wipeId.Substring(0, 8)}.json";
                string fullPath = Path.Combine(savePath, fileName);
                File.WriteAllText(fullPath, responseBody);

                Console.WriteLine($"\n✅ Certificate successfully created and saved to:");
                Console.WriteLine(fullPath);
            }
            else
            {
                Console.WriteLine($"\nError creating certificate: Server responded with status {response.StatusCode} - {await response.Content.ReadAsStringAsync()}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\nAn error occurred while creating the certificate: {ex.Message}");
        }
    }

    public static List<Drive> FindRemovableDrivesOnLinux()
    {
        var drives = new List<Drive>();
        try
        {
            string[] mounts = File.ReadAllLines("/proc/mounts");
            foreach (string mount in mounts)
            {
                string[] parts = mount.Split(' ');
                string device = parts[0];
                string mountPoint = parts[1];

                if (device.StartsWith("/dev/sd") && (mountPoint.StartsWith("/media") || mountPoint.StartsWith("/mnt")))
                {
                    try
                    {
                        var driveInfo = new DriveInfo(mountPoint);
                        if (driveInfo.IsReady)
                        {
                            string physicalDiskPath = new string(device.TakeWhile(c => !char.IsDigit(c)).ToArray());
                            if (!drives.Any(d => d.DevicePath == physicalDiskPath))
                            {
                                drives.Add(new Drive(physicalDiskPath, mountPoint, driveInfo.TotalSize));
                            }
                        }
                    }
                    catch { /* Ignore drives that aren't fully ready */ }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error reading drives: {ex.Message}");
        }
        return drives;
    }
}