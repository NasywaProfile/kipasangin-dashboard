<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\MasterKipas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;

class FanApiController extends Controller
{
    public function __construct()
    {
        Log::info('API Request: ' . request()->method() . ' ' . request()->fullUrl(), [
            'data' => request()->all()
        ]);
    }
    public function indexDevices(): JsonResponse
    {
        return response()->json(MasterKipas::all());
    }

    // ──────────────────────────────────────────────────────────
    //  POST /api/master-kipas
    //  Body: { device_id, nama_kipas, ip_address? }
    // ──────────────────────────────────────────────────────────
    public function storeDevice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id'  => 'required|string|max:50',
            'nama_kipas' => 'required|string|max:100',
            'ip_address' => 'nullable|string|max:45',
        ]);

        $device = MasterKipas::updateOrCreate(
            ['device_id' => $data['device_id']],
            $data
        );

        return response()->json(['status' => 'success', 'id' => $device->id], 201);
    }

    // ──────────────────────────────────────────────────────────
    //  PUT /api/master-kipas/{id}
    //  Body: { status?, suhu? }
    // ──────────────────────────────────────────────────────────
    public function updateDevice(Request $request, int $id): JsonResponse
    {
        $device = MasterKipas::findOrFail($id);

        $data = $request->validate([
            'status'     => 'nullable|in:ON,OFF,AUTO',
            'suhu'       => 'nullable|numeric',
            'ip_address' => 'nullable|string|max:45',
        ]);

        $device->update(array_filter($data, fn($v) => !is_null($v)));

        return response()->json(['status' => 'success', affected => 1]);
    }

    // ──────────────────────────────────────────────────────────
    //  GET /api/activity-log?date=YYYY-MM-DD&device_id=1
    // ──────────────────────────────────────────────────────────
    public function indexActivity(Request $request): JsonResponse
    {
        $query = ActivityLog::with('device:id,device_id,nama_kipas')
            ->where('action_type', '!=', 'ERROR')
            ->latest('created_at')
            ->limit(200);

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }
        if ($request->filled('device_id')) {
            $query->where('device_id', $request->integer('device_id'));
        }

        return response()->json($query->get());
    }

    // ──────────────────────────────────────────────────────────
    //  POST /api/activity-log
    //  Body: { device_id, action_type, temperature?, keterangan? }
    // ──────────────────────────────────────────────────────────
    public function storeActivity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id'   => 'required', // Bisa integer ID atau string device_id (FAN-001)
            'action_type' => 'required|string|max:50',
            'temperature' => 'nullable|numeric',
            'keterangan'  => 'nullable|string',
        ]);

        $log = ActivityLog::create($data);

        // Sync status di master_kipas
        $actionType = strtoupper($data['action_type']);
        
        // Coba cari device (bisa ID atau device_id string)
        $device = MasterKipas::find($data['device_id']);
        if (!$device) {
            $device = MasterKipas::where('device_id', $data['device_id'])->first();
        }

        if ($device) {
            $updates = [];
            if (in_array($actionType, ['ON', 'OFF', 'AUTO', 'MANUAL_ON', 'MANUAL_OFF', 'AUTO_ON', 'AUTO_OFF'])) {
                $updates['status'] = str_contains($actionType, 'ON') ? 'ON' : 'OFF';
            }
            if (!is_null($data['temperature'] ?? null)) {
                $updates['suhu'] = $data['temperature'];
            }
            if ($updates) {
                $device->update($updates);
            }
        }

        return response()->json(['status' => 'success', 'id' => $log->id], 201);
    }

    // ──────────────────────────────────────────────────────────
    //  GET /api/error-log?date=YYYY-MM-DD&device_id=1
    // ──────────────────────────────────────────────────────────
    public function indexErrors(Request $request): JsonResponse
    {
        $query = ActivityLog::with('device:id,device_id,nama_kipas')
            ->where('action_type', 'ERROR')
            ->latest('created_at')
            ->limit(200);

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }
        if ($request->filled('device_id')) {
            $query->where('device_id', $request->integer('device_id'));
        }

        // Kita map keterangan ke error_msg agar JS tidak pecah
        $logs = $query->get()->map(function($log) {
            $log->error_msg = $log->keterangan;
            return $log;
        });

        return response()->json($logs);
    }

    // ──────────────────────────────────────────────────────────
    //  POST /api/error-log
    //  Body: { device_id, error_msg, severity? }
    // ──────────────────────────────────────────────────────────
    public function storeError(Request $request): JsonResponse
    {
        Log::info('POST /api/error-log triggered (merged to activity)', $request->all());

        $data = $request->validate([
            'device_id'  => 'required',
            'error_msg'  => 'required|string',
            'severity'   => 'nullable|string',
        ]);

        // Coba cari device (bisa ID atau device_id string)
        $device = MasterKipas::find($data['device_id']);
        if (!$device) {
            $device = MasterKipas::where('device_id', $data['device_id'])->first();
        }

        $log = ActivityLog::create([
            'device_id'   => $device ? $device->id : $data['device_id'],
            'action_type' => 'ERROR',
            'keterangan'  => $data['error_msg'],
        ]);

        return response()->json(['status' => 'success', 'id' => $log->id], 201);
    }
}
